// Génère supabase/seed.sql à partir du contenu actuel du site (HTML/JS statiques)
const fs = require('fs');
const path = require('path');
const SRC = process.argv[2];
const OUT = process.argv[3];

function extractObject(file, varName) {
  const txt = fs.readFileSync(path.join(SRC, file), 'utf8');
  const start = txt.indexOf('var ' + varName + ' = ');
  const open = txt.indexOf('{', start);
  let depth = 0, i = open, inStr = null;
  for (; i < txt.length; i++) {
    const c = txt[i];
    if (inStr) { if (c === '\\') { i++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    if (c === '}') { depth--; if (depth === 0) break; }
  }
  return Function('return (' + txt.slice(open, i + 1) + ')')();
}
const q = v => v === null || v === undefined ? 'null' : "'" + String(v).replace(/'/g, "''") + "'";
const j = v => q(JSON.stringify(v)) + '::jsonb';
const decode = s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
let sql = '-- Données initiales importées du site existant\n';
const J = { realisations: [], articles: [], gallery: [], team: [], testimonials: [], partners: [], impact_metrics: [], settings: [] };

// ---------- Réalisations ----------
const reals = extractObject('js/realisation-details.js', 'realisations');
const services = fs.readFileSync(path.join(SRC, 'services.html'), 'utf8');
const cards = {};
services.replace(/<img src="([^"]+)"[^>]*>\s*<\/button>\s*<div class="activity-flip-back"[^>]*>\s*<h3 class="card-title">([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<a href="realisation-details\.html\?realisation=([^"]+)"/g,
  (m, img, t, p, slug) => { cards[slug] = { cover: img, summary: decode(p) }; });
const realDates = { 'octobre-rose': '2026-10-20', 'toujours-forte': '2026-08-29', 'quand-amour-fait-mal': null, 'sante-femme-decide': null };
let sort = 0;
for (const [slug, r] of Object.entries(reals)) {
  const c = cards[slug] || {};
  J.realisations.push({ slug, title: r.title, heading: r.heading, category: r.category, image: c.cover || r.image, summary: c.summary || r.description, description: r.description, intro: r.intro, features_heading: r.featuresHeading, features: r.features, process_heading: r.processHeading, steps: r.steps, faq_heading: r.faqHeading, questions: r.questions, gallery: r.image && r.image !== c.cover ? [r.image] : [], event_date: realDates[slug], sort });
  sql += `insert into realisations (slug,title,heading,category,image,summary,description,intro,features_heading,features,process_heading,steps,faq_heading,questions,gallery,event_date,published,sort) values (${q(slug)},${q(r.title)},${q(r.heading)},${q(r.category)},${q(c.cover || r.image)},${q(c.summary || r.description)},${q(r.description)},${j(r.intro)},${q(r.featuresHeading)},${j(r.features)},${q(r.processHeading)},${j(r.steps)},${q(r.faqHeading)},${j(r.questions)},${j(r.image && r.image !== c.cover ? [r.image] : [])},${q(realDates[slug])},true,${sort++}) on conflict (slug) do nothing;\n`;
}

// ---------- Articles ----------
const arts = extractObject('js/blog-detail.js', 'articles');
const blog = fs.readFileSync(path.join(SRC, 'blog.html'), 'utf8');
const meta = {};
blog.replace(/data-article="([^"]+)">[\s\S]*?<p class="small mb-0">([\s\S]*?)<\/p>[\s\S]*?bi-clock me-1"><\/i>(\d+) min/g, (m, slug, ex, min) => { meta[slug] = { excerpt: decode(ex), min: +min }; });
const order = []; blog.replace(/data-blog-entry data-article="([^"]+)"/g, (m, s) => order.push(s));
let n = 0;
for (const slug of order) {
  const a = arts[slug]; if (!a) continue;
  const m = meta[slug] || {};
  const pub = new Date(Date.UTC(2026, 10, 12, 12, 0, 0) - n * 3600 * 1000).toISOString();
  J.articles.push({ slug, title: a.title, category: a.category, image: a.image, alt: a.alt, excerpt: m.excerpt || a.intro, intro: a.intro, paragraphs: a.paragraphs, takeaway: a.takeaway, tags: a.tags, read_minutes: m.min || 4, published_at: pub, sort: n });
  sql += `insert into articles (slug,title,category,image,alt,excerpt,intro,paragraphs,takeaway,tags,read_minutes,published,published_at,sort) values (${q(slug)},${q(a.title)},${q(a.category)},${q(a.image)},${q(a.alt)},${q(m.excerpt || a.intro)},${q(a.intro)},${j(a.paragraphs)},${q(a.takeaway)},${j(a.tags)},${m.min || 4},true,${q(pub)},${n}) on conflict (slug) do nothing;\n`;
  n++;
}

// ---------- Galerie ----------
const port = fs.readFileSync(path.join(SRC, 'portfolio.html'), 'utf8');
let g = 0;
port.replace(/data-category="([^"]+)">\s*<a href="portfolio-single\.html\?photo=([^"]+)"[^>]*>\s*<img src="([^"]+)" alt="([^"]*)">\s*<div class="portfolio-overlay">\s*<span>([\s\S]*?)<\/span>\s*<h5>([\s\S]*?)<\/h5>/g,
  (m, cat, key, img, alt, label, title) => {
    J.gallery.push({ image: img, category: cat, label: decode(label), title: decode(title), alt: decode(alt), legacy_key: key, sort: g });
    sql += `insert into gallery (image,category,label,title,alt,legacy_key,sort) values (${q(img)},${q(cat)},${q(decode(label))},${q(decode(title))},${q(decode(alt))},${q(key)},${g++});\n`;
  });

// ---------- Équipe ----------
const about = fs.readFileSync(path.join(SRC, 'about.html'), 'utf8');
let t = 0;
about.replace(/<img src="(img\/team\/[^"]+)"[^>]*>\s*<h3 class="card-title">([\s\S]*?)<\/h3>\s*<p class="text-primary-custom fw-semibold mb-2">([\s\S]*?)<\/p>\s*<p class="small">([\s\S]*?)<\/p>/g,
  (m, img, name, role, bio) => { J.team.push({ name: decode(name), role: decode(role), photo: img, bio: decode(bio), sort: t }); sql += `insert into team (name,role,photo,bio,sort) values (${q(decode(name))},${q(decode(role))},${q(img)},${q(decode(bio))},${t++});\n`; });

// ---------- Témoignages ----------
const index = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
let s = 0;
index.replace(/<div class="testimonial-card">\s*<div class="stars">[^<]*<\/div>\s*<p>([\s\S]*?)<\/p>\s*<div class="testimonial-author">\s*<img src="([^"]+)"[^>]*>\s*<div>\s*<div class="name">([\s\S]*?)<\/div>\s*<div class="role">([\s\S]*?)<\/div>/g,
  (m, txt, img, name, role) => { J.testimonials.push({ name: decode(name), role: decode(role), photo: img.replace(/^\//, ''), content: decode(txt).replace(/\s+/g, ' '), sort: s }); sql += `insert into testimonials (name,role,photo,content,sort) values (${q(decode(name))},${q(decode(role))},${q(img.replace(/^\//, ''))},${q(decode(txt).replace(/\s+/g, ' '))},${s++});\n`; });

// ---------- Partenaires ----------
sql += `insert into partners (name,logo,url,sort) values ('Aulia','img/client/logo-aulia.png','https://aulia-beta.vercel.app',0);\n`;
sql += `insert into partners (name,logo,url,sort) values ('Centre de Diagnostic Eyano',null,null,1);\n`;

// ---------- Indicateurs d'impact ----------
const metrics = [
  ['Impact global (à préciser dans l\'administration)', 60, 100, '%', '#e83e8c']
];
metrics.forEach((m, i) => { J.impact_metrics.push({ label: m[0], value: m[1], target: m[2], unit: m[3], color: m[4], sort: i }); sql += `insert into impact_metrics (label,value,target,unit,color,sort) values (${q(m[0])},${m[1]},${m[2]},${q(m[3])},${q(m[4])},${i});\n`; });

// ---------- Paramètres ----------
const settings = {
  contact: {
    association_name: 'Mwinue Asimame',
    tagline: 'Former. Éveiller. Promouvoir.',
    email: 'contact@mwinue-asimame.org',
    phones: ['+243 819 580 061', '+243 999 724 356'],
    address: 'Ville de Kolwezi, Province du Lualaba, RDC',
    address_detail: 'Adresse physique précise à confirmer',
    city: 'Kolwezi',
    map_query: 'Kolwezi, Lualaba, République démocratique du Congo',
    whatsapp: '+243819580061',
    tiktok: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    youtube: ''
  },
  general: {
    founded_at: '2026-02-01T00:00:00+02:00',
    hero_rating: '4.9/5',
    comments_moderation: false,
    donation_min_cdf: 1000,
    donation_min_usd: 1,
    donation_amounts: [10000, 25000, 50000, 100000],
    auto_lock_minutes: 5
  },
  latest_activity: {
    eyebrow: 'Dernière activité',
    title: "Unis contre les cancers : de la sensibilisation à l'action",
    text: "Sous le haut patronage de Madame la Gouverneure du Lualaba, le Ministère Provincial de la Santé, Éducation, Affaires Sociales et Humanitaires, Genre, Famille et Enfant a organisé, le 6 novembre 2026, une matinée de sensibilisation consacrée à la prévention, au dépistage précoce et à la prise en charge des cancers.",
    image: 'img/evenement/cancers-sensibilisation.png',
    badge_title: 'Ensemble contre les cancers',
    badge_date: '6 novembre 2026',
    bullets: [
      ['Sensibilisation et prévention', "échanges autour des différents types de cancers et de l'importance du dépistage précoce."],
      ['Expertise médicale', 'interventions de spécialistes sur les cancers pédiatriques, du sein, du col de l\'utérus et de la prostate.'],
      ['Accompagnement et information', 'lutte contre les fausses croyances, santé mentale et soutien psychosocial.']
    ],
    button_label: 'Voir toutes nos activités',
    button_link: 'services.html'
  }
};
J.partners.push({ name: 'Aulia', logo: 'img/client/logo-aulia.png', url: 'https://aulia-beta.vercel.app', sort: 0 }, { name: 'Centre de Diagnostic Eyano', logo: null, url: null, sort: 1 });
for (const [k, v] of Object.entries(settings)) J.settings.push({ key: k, value: v });
for (const [k, v] of Object.entries(settings)) sql += `insert into settings (key,value) values (${q(k)},${j(v)}) on conflict (key) do nothing;\n`;

fs.writeFileSync(OUT, sql);
fs.writeFileSync(OUT.replace(/\.sql$/, '.json'), JSON.stringify(J));
console.log('realisations', Object.keys(reals).length, 'articles', n, 'gallery', g, 'team', t, 'testimonials', s, 'bytes', sql.length);
