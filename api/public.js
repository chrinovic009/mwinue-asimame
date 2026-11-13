'use strict';
/* API publique du site : contenus, commentaires, j'aime, vues, contact, newsletter */
const C = require('../lib/core');
const { db, enc, HttpError } = C;

const TYPES = { realisation: 'realisations', article: 'articles' };
const CARD_R = 'id,slug,title,heading,category,image,summary,event_date,location,featured,views,likes,created_at,sort';
const CARD_A = 'id,slug,title,category,image,alt,excerpt,tags,read_minutes,author_name,published_at,views,likes';

function visitor(req, b) {
  const v = C.str((b && b.visitor) || req.headers['x-visitor-id'] || '', 64);
  return /^[a-zA-Z0-9-]{8,64}$/.test(v) ? v : null;
}
function impactOf(metrics) {
  if (!metrics.length) return 0;
  const p = metrics.reduce((s, m) => s + Math.min(100, (Number(m.value) / (Number(m.target) || 1)) * 100), 0) / metrics.length;
  return Math.round(p * 10) / 10;
}
async function commentCounts(type) {
  const rows = await db.select('comments', 'select=target_id&status=eq.approved&target_type=eq.' + type);
  const out = {};
  rows.forEach(r => { out[r.target_id] = (out[r.target_id] || 0) + 1; });
  return out;
}
function cache(res, seconds) {
  res.setHeader('Cache-Control', 'public, s-maxage=' + seconds + ', stale-while-revalidate=' + (seconds * 4));
}

module.exports = C.handler(async (req, res) => {
  const r = String(req.query.r || '');
  const b = C.body(req);

  if (req.method === 'GET') {
    /* ----- Informations générales du site ----- */
    if (r === 'site') {
      const [settings, partners, team, testimonials, metrics, activities, articles, lastReals] = await Promise.all([
        C.getSettings(),
        db.select('partners', 'select=id,name,logo,url&published=eq.true&order=sort.asc'),
        db.select('team', 'select=id,name,role,photo,bio,socials&published=eq.true&order=sort.asc'),
        db.select('testimonials', 'select=id,name,role,photo,content,rating&published=eq.true&order=sort.asc'),
        db.select('impact_metrics', 'select=id,label,value,target,unit,color&published=eq.true&order=sort.asc'),
        db.count('realisations', 'published=eq.true'),
        db.count('articles', 'published=eq.true'),
        db.select('realisations', 'select=' + CARD_R + '&published=eq.true&order=featured.desc,event_date.desc.nullslast,sort.asc&limit=3')
      ]);
      const g = settings.general || {};
      const out = {
        contact: settings.contact || {},
        general: { founded_at: g.founded_at, hero_rating: g.hero_rating, comments_moderation: !!g.comments_moderation },
        latest_activity: settings.latest_activity || null,
        home: settings.home || {},
        partners, team, testimonials,
        impact: { metrics, percent: impactOf(metrics) },
        stats: { activities, articles, team: team.length, partners: partners.length },
        latest_realisations: lastReals
      };
      cache(res, 30);
      return out;
    }

    /* ----- Réalisations ----- */
    if (r === 'realisations') {
      const [items, counts] = await Promise.all([
        db.select('realisations', 'select=' + CARD_R + '&published=eq.true&order=sort.asc,created_at.desc'),
        commentCounts('realisation')
      ]);
      cache(res, 20);
      return { items: items.map(i => Object.assign(i, { comments: counts[i.id] || 0 })) };
    }
    if (r === 'realisation') {
      const slug = C.str(req.query.slug, 120);
      const item = await db.one('realisations', 'select=*&published=eq.true&slug=eq.' + enc(slug));
      if (!item) throw new HttpError(404, 'Réalisation introuvable.');
      const list = await db.select('realisations', 'select=slug,title&published=eq.true&order=sort.asc,created_at.desc');
      delete item.author_id;
      return { item, list };
    }

    /* ----- Actualités ----- */
    if (r === 'articles') {
      const [items, counts] = await Promise.all([
        db.select('articles', 'select=' + CARD_A + '&published=eq.true&published_at=lte.' + enc(new Date().toISOString()) + '&order=published_at.desc,sort.asc'),
        commentCounts('article')
      ]);
      cache(res, 20);
      return { items: items.map(i => Object.assign(i, { comments: counts[i.id] || 0 })) };
    }
    if (r === 'article') {
      const slug = C.str(req.query.slug, 120);
      const item = await db.one('articles', 'select=*&published=eq.true&slug=eq.' + enc(slug));
      if (!item) throw new HttpError(404, 'Article introuvable.');
      const recent = await db.select('articles', 'select=slug,title,image,published_at&published=eq.true&slug=neq.' + enc(slug) + '&order=published_at.desc&limit=4');
      delete item.author_id;
      return { item, recent };
    }

    /* ----- Galerie ----- */
    if (r === 'gallery') {
      const items = await db.select('gallery', 'select=*&published=eq.true&order=sort.asc,created_at.desc');
      cache(res, 30);
      return { items };
    }
    if (r === 'photo') {
      const id = C.str(req.query.id, 40);
      if (!C.isUuid(id)) throw new HttpError(404, 'Photo introuvable.');
      const item = await db.one('gallery', 'select=*&published=eq.true&id=eq.' + enc(id));
      if (!item) throw new HttpError(404, 'Photo introuvable.');
      const all = await db.select('gallery', 'select=id,title,legacy_key&published=eq.true&order=sort.asc,created_at.desc');
      const i = all.findIndex(x => x.id === id);
      return { item, previous: all[(i - 1 + all.length) % all.length], next: all[(i + 1) % all.length] };
    }

    /* ----- Commentaires ----- */
    if (r === 'comments') {
      const type = C.str(req.query.type, 20);
      if (!['realisation', 'article', 'site'].includes(type)) throw new HttpError(400, 'Type invalide.');
      const id = C.str(req.query.id, 40);
      let q = 'select=id,parent_id,author_name,content,is_staff,likes,created_at&status=eq.approved&target_type=eq.' + type;
      if (type !== 'site') { if (!C.isUuid(id)) throw new HttpError(400, 'Identifiant invalide.'); q += '&target_id=eq.' + id; }
      const rows = await db.select('comments', q + '&order=created_at.asc&limit=500');
      const roots = rows.filter(c => !c.parent_id).map(c => Object.assign(c, { replies: [] }));
      const byId = {}; roots.forEach(c => { byId[c.id] = c; });
      rows.filter(c => c.parent_id).forEach(c => { if (byId[c.parent_id]) byId[c.parent_id].replies.push(c); });
      roots.reverse();
      return { items: roots, total: rows.length };
    }
    if (r === 'my-likes') {
      const v = visitor(req, null);
      if (!v) return { items: [] };
      const rows = await db.select('likes', 'select=target_type,target_id&visitor_id=eq.' + enc(v) + '&limit=1000');
      return { items: rows };
    }
    throw new HttpError(404, 'Route inconnue.');
  }

  if (req.method !== 'POST') throw new HttpError(405, 'Méthode non autorisée.');

  /* ----- Comptage des vues (1 par visiteur / jour) ----- */
  if (r === 'view') {
    const type = C.str(b.type, 20), id = C.str(b.id, 40);
    const v = visitor(req, b) || C.ipHash(req);
    if (!TYPES[type] || !C.isUuid(id)) {
      if (type === 'page') {
        await db.insertIgnore('views', { target_type: 'page', target_id: C.str(b.id, 80) || 'home', visitor_id: v }, 'target_type,target_id,visitor_id,day').catch(() => {});
        return { ok: true };
      }
      throw new HttpError(400, 'Cible invalide.');
    }
    const inserted = await db.insertIgnore('views', { target_type: type, target_id: id, visitor_id: v }, 'target_type,target_id,visitor_id,day');
    let views;
    if (Array.isArray(inserted) && inserted.length) views = await db.rpc('bump_counter', { p_table: TYPES[type], p_id: id, p_column: 'views', p_delta: 1 });
    else { const row = await db.one(TYPES[type], 'select=views&id=eq.' + id); views = row ? row.views : 0; }
    return { views };
  }

  /* ----- J'aime (bascule) ----- */
  if (r === 'like') {
    const type = C.str(b.type, 20), id = C.str(b.id, 40);
    const v = visitor(req, b);
    if (!v) throw new HttpError(400, 'Visiteur non identifié.');
    const table = type === 'comment' ? 'comments' : TYPES[type];
    if (!table || !C.isUuid(id)) throw new HttpError(400, 'Cible invalide.');
    const inserted = await db.insertIgnore('likes', { target_type: type, target_id: id, visitor_id: v }, 'target_type,target_id,visitor_id');
    let liked = true, delta = 1;
    if (!Array.isArray(inserted) || !inserted.length) {
      await db.remove('likes', 'target_type=eq.' + type + '&target_id=eq.' + id + '&visitor_id=eq.' + enc(v));
      liked = false; delta = -1;
    }
    const likes = await db.rpc('bump_counter', { p_table: table, p_id: id, p_column: 'likes', p_delta: delta });
    return { liked, likes };
  }

  /* ----- Nouveau commentaire / réponse ----- */
  if (r === 'comment') {
    if (b.website) throw new HttpError(400, 'Requête refusée.');
    const type = C.str(b.type, 20);
    if (!['realisation', 'article', 'site'].includes(type)) throw new HttpError(400, 'Type invalide.');
    const name = C.str(b.name, 80), content = C.str(b.content, 3000), email = C.str(b.email, 200);
    if (name.length < 2) throw new HttpError(400, 'Indiquez votre nom.');
    if (content.length < 2) throw new HttpError(400, 'Votre commentaire est vide.');
    if (email && !C.isEmail(email)) throw new HttpError(400, 'Adresse e-mail invalide.');
    let targetId = null;
    if (type !== 'site') {
      targetId = C.str(b.id, 40);
      if (!C.isUuid(targetId)) throw new HttpError(400, 'Cible invalide.');
      const exists = await db.one(TYPES[type], 'select=id&published=eq.true&id=eq.' + targetId);
      if (!exists) throw new HttpError(404, 'Contenu introuvable.');
    }
    let parentId = null;
    if (b.parent_id) {
      const parent = await db.one('comments', 'select=id,parent_id,target_type,target_id&id=eq.' + enc(C.str(b.parent_id, 40)));
      if (!parent || parent.target_type !== type || (parent.target_id || null) !== targetId) throw new HttpError(400, 'Commentaire parent invalide.');
      parentId = parent.parent_id || parent.id;
    }
    const ih = C.ipHash(req);
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    if (await db.count('comments', 'ip_hash=eq.' + ih + '&created_at=gte.' + enc(since)) >= 6) throw new HttpError(429, 'Vous commentez trop vite. Patientez quelques minutes.');
    const g = await C.getSetting('general');
    const status = g.comments_moderation ? 'pending' : 'approved';
    const c = await db.insert('comments', {
      target_type: type, target_id: targetId, parent_id: parentId, author_name: name, author_email: email || null,
      content, status, visitor_id: visitor(req, b), ip_hash: ih
    });
    return {
      comment: { id: c.id, parent_id: c.parent_id, author_name: c.author_name, content: c.content, is_staff: false, likes: 0, created_at: c.created_at, replies: [] },
      pending: status === 'pending'
    };
  }

  /* ----- Formulaire de contact ----- */
  if (r === 'contact') {
    if (b.website) throw new HttpError(400, 'Requête refusée.');
    const name = C.str(b.name, 120), content = C.str(b.message || b.content, 5000), email = C.str(b.email, 200);
    if (!name || !content) throw new HttpError(400, 'Nom et message requis.');
    if (email && !C.isEmail(email)) throw new HttpError(400, 'Adresse e-mail invalide.');
    await db.insert('messages', { name, email: email || null, phone: C.str(b.phone, 40) || null, subject: C.str(b.subject, 200) || null, content }, 'return=minimal');
    return { ok: true };
  }

  /* ----- Newsletter ----- */
  if (r === 'newsletter') {
    const email = C.str(b.email, 200).toLowerCase();
    if (!C.isEmail(email)) throw new HttpError(400, 'Adresse e-mail invalide.');
    await db.upsert('subscribers', { email, active: true }, 'email');
    return { ok: true };
  }

  throw new HttpError(404, 'Route inconnue.');
});
