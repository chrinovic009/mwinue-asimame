'use strict';
/* Campagnes et mobilisations : affichage, clôture, conversion en réalisation, dernière activité */
const C = require('./core');
const { db, enc, HttpError } = C;

const TZ = 'Africa/Lubumbashi';
const PUBLIC_FIELDS = 'id,kind,title,category,headline,headline_highlight,lead,start_date,end_date,start_caption,end_caption,location,poster,poster_full,themes,pillars,hashtags,cta_label,cta_link';

// Date du jour (AAAA-MM-JJ) à l'heure de Kolwezi
function today() { return new Date().toLocaleDateString('en-CA', { timeZone: TZ }); }

function frDate(d, withYear) {
  if (!d) return '';
  const o = { day: 'numeric', month: 'long', timeZone: 'UTC' };
  if (withYear !== false) o.year = 'numeric';
  return new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString('fr-FR', o);
}
function period(c) {
  if (!c.end_date || c.end_date === c.start_date) return frDate(c.start_date);
  const sameYear = String(c.start_date).slice(0, 4) === String(c.end_date).slice(0, 4);
  return 'Du ' + frDate(c.start_date, !sameYear) + ' au ' + frDate(c.end_date);
}

async function uniqueSlug(base) {
  const root = C.slugify(base) || 'campagne';
  let slug = root, i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const row = await db.one('realisations', 'select=id&slug=eq.' + enc(slug));
    if (!row) return slug;
    i += 1; slug = root + '-' + i;
  }
}

function realisationRow(c) {
  const report = Array.isArray(c.report) ? c.report.filter(Boolean) : [];
  const photos = Array.isArray(c.photos) ? c.photos.filter(Boolean) : [];
  const poster = c.poster_full || c.poster;
  const themes = Array.isArray(c.themes) ? c.themes : [];
  const pillars = Array.isArray(c.pillars) ? c.pillars : [];
  const label = c.kind === 'mobilisation' ? 'Mobilisation' : 'Campagne';
  return {
    title: c.title,
    heading: [c.headline, c.headline_highlight].filter(Boolean).join(' ') || c.title,
    category: c.category || label,
    image: photos[0] || c.poster || null,
    summary: (report[0] || c.lead || '').slice(0, 400),
    description: (c.lead || report[0] || '').slice(0, 300),
    intro: [c.lead].concat(report).filter(Boolean),
    features_heading: pillars.length ? 'Notre engagement' : null,
    features: pillars,
    process_heading: themes.length ? 'Thèmes abordés' : null,
    steps: themes.map(t => [t, '']),
    gallery: photos.concat(poster && !photos.includes(poster) ? [poster] : []),
    event_date: c.start_date,
    location: c.location || null
  };
}

/* Clôture : la campagne devient une réalisation, l'administrateur choisira ensuite pour la dernière activité */
async function finish(campaign, opts) {
  opts = opts || {};
  const user = opts.user || null;
  // Réservation atomique : une seule requête peut clôturer la campagne
  const claim = { status: 'finishing', updated_at: new Date().toISOString() };
  if (opts.end_date) claim.end_date = opts.end_date;
  if (Array.isArray(opts.report)) claim.report = opts.report;
  if (Array.isArray(opts.photos)) claim.photos = opts.photos;
  const c = await db.update('campaigns', 'id=eq.' + enc(campaign.id) + '&status=eq.active', claim);
  if (!c) throw new HttpError(409, 'Cette campagne est déjà terminée.');
  try {
    const row = realisationRow(c);
    row.slug = await uniqueSlug(c.title);
    row.published = opts.publish !== false;
    if (user) row.author_id = user.id;
    const real = await db.insert('realisations', row);
    const done = await db.update('campaigns', 'id=eq.' + enc(c.id), {
      status: 'finished', finished_at: new Date().toISOString(), end_date: c.end_date || today(),
      realisation_id: real.id, latest_choice: 'pending', updated_at: new Date().toISOString()
    });
    await C.audit(user, 'finish', 'campaigns', c.id, { realisation: real.slug, auto: !user });
    return { campaign: done, realisation: real };
  } catch (e) {
    await db.update('campaigns', 'id=eq.' + enc(c.id), { status: 'active' }).catch(() => {});
    throw e;
  }
}

// Clôture automatique des campagnes dont la date de fin est passée
async function finalizeDue() {
  let due = [];
  try { due = await db.select('campaigns', 'select=*&status=eq.active&end_date=lt.' + today() + '&limit=20'); } catch (e) { return []; }
  const out = [];
  for (const c of due) {
    try { out.push(await finish(c, {})); } catch (e) { /* une autre requête l'a déjà clôturée */ }
  }
  return out;
}

// Place la réalisation issue de la campagne comme « dernière activité » de l'accueil
async function setLatest(campaign, user) {
  if (!campaign.realisation_id) throw new HttpError(400, "La réalisation liée à cette campagne n'existe plus.");
  const r = await db.one('realisations', 'select=*&id=eq.' + enc(campaign.realisation_id));
  if (!r) throw new HttpError(400, "La réalisation liée à cette campagne n'existe plus.");
  const pillars = Array.isArray(campaign.pillars) ? campaign.pillars : [];
  const value = {
    eyebrow: 'Dernière activité',
    title: r.title,
    text: r.summary || r.description || '',
    image: (Array.isArray(r.gallery) && r.gallery[0]) || r.image || '',
    badge_title: r.category || campaign.title,
    badge_date: period(campaign),
    bullets: (r.features && r.features.length ? r.features : pillars).slice(0, 3),
    button_label: 'Découvrir cette activité',
    button_link: 'realisation-details.html?realisation=' + r.slug,
    source: { type: 'campaign', id: campaign.id }
  };
  if (!r.published) await db.update('realisations', 'id=eq.' + enc(r.id), { published: true, updated_at: new Date().toISOString() });
  await db.upsert('settings', { key: 'latest_activity', value, updated_at: new Date().toISOString() }, 'key');
  await C.audit(user, 'latest', 'campaigns', campaign.id, { realisation: r.slug });
  return value;
}

// Campagnes visibles sur l'accueil (à venir ou en cours)
async function publicList() {
  await finalizeDue();
  return db.select('campaigns', 'select=' + PUBLIC_FIELDS + '&published=eq.true&status=eq.active&order=start_date.asc,sort.asc&limit=6');
}

module.exports = { today, period, finish, finalizeDue, setLatest, publicList, realisationRow };
