'use strict';
/* API d'administration : CRUD complet avec contrôle des permissions */
const C = require('../lib/core');
const { db, enc, HttpError, can } = C;
const pay = require('../lib/payments');

const RESOURCES = {
  realisations: {
    table: 'realisations', perm: 'realisations', order: 'sort.asc,created_at.desc', publishable: true, slug: true, author: true,
    fields: ['slug', 'title', 'heading', 'category', 'image', 'summary', 'description', 'intro', 'features_heading', 'features',
      'process_heading', 'steps', 'faq_heading', 'questions', 'gallery', 'event_date', 'location', 'published', 'featured', 'sort'],
    search: ['title', 'category']
  },
  articles: {
    table: 'articles', perm: 'articles', order: 'published_at.desc', publishable: true, slug: true, author: true,
    fields: ['slug', 'title', 'category', 'image', 'alt', 'excerpt', 'intro', 'paragraphs', 'takeaway', 'tags', 'read_minutes',
      'author_name', 'published', 'published_at', 'sort'],
    search: ['title', 'category']
  },
  gallery: {
    table: 'gallery', perm: 'gallery', order: 'sort.asc,created_at.desc', publishable: true,
    fields: ['image', 'category', 'label', 'title', 'alt', 'description', 'event_date', 'theme', 'tags', 'published', 'sort'],
    search: ['title', 'category']
  },
  team: { table: 'team', perm: 'team', order: 'sort.asc', publishable: true, fields: ['name', 'role', 'photo', 'bio', 'socials', 'sort', 'published'], search: ['name', 'role'] },
  partners: { table: 'partners', perm: 'partners', order: 'sort.asc', publishable: true, fields: ['name', 'logo', 'url', 'sort', 'published'], search: ['name'] },
  testimonials: { table: 'testimonials', perm: 'testimonials', order: 'sort.asc', publishable: true, fields: ['name', 'role', 'photo', 'content', 'rating', 'sort', 'published'], search: ['name'] },
  impact_metrics: { table: 'impact_metrics', perm: 'impact', order: 'sort.asc', publishable: true, fields: ['label', 'value', 'target', 'unit', 'color', 'sort', 'published'], search: ['label'] },
  comments: { table: 'comments', perm: 'comments', order: 'created_at.desc', fields: ['status', 'content'], search: ['author_name', 'content'], noCreate: true },
  messages: { table: 'messages', perm: 'messages', order: 'created_at.desc', fields: ['read', 'archived'], search: ['name', 'email', 'subject', 'content'], noCreate: true },
  subscribers: { table: 'subscribers', perm: 'subscribers', order: 'created_at.desc', fields: ['email', 'active'], search: ['email'] },
  donations: { table: 'donations', perm: 'donations', order: 'created_at.desc', fields: ['status', 'provider_message'], search: ['reference', 'donor_name', 'phone'], noCreate: true, noDelete: true },
  audit_log: { table: 'audit_log', perm: '__admin', order: 'created_at.desc', fields: [], readOnly: true, search: ['action', 'user_name', 'entity'] }
};

const JSON_FIELDS = ['intro', 'features', 'steps', 'questions', 'gallery', 'paragraphs', 'tags', 'socials'];
const NUM_FIELDS = ['sort', 'read_minutes', 'value', 'target', 'rating'];
const BOOL_FIELDS = ['published', 'featured', 'read', 'archived', 'active'];

function clean(cfg, input) {
  const out = {};
  cfg.fields.forEach(f => {
    if (!(f in input)) return;
    let v = input[f];
    if (JSON_FIELDS.includes(f)) {
      if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { v = v.split('\n').map(s => s.trim()).filter(Boolean); } }
      if (v === null || v === undefined) v = f === 'socials' ? {} : [];
    } else if (NUM_FIELDS.includes(f)) {
      v = v === '' || v === null ? 0 : Number(v);
      if (!Number.isFinite(v)) throw new HttpError(400, 'Valeur numérique invalide : ' + f);
    } else if (BOOL_FIELDS.includes(f)) {
      v = v === true || v === 'true' || v === 1 || v === '1' || v === 'on';
    } else if (f === 'event_date' || f === 'published_at') {
      v = v ? String(v) : null;
      if (f === 'published_at' && !v) v = new Date().toISOString();
    } else if (f === 'status') {
      v = C.str(v, 20);
    } else {
      v = v === null || v === undefined ? null : C.str(v, 20000);
    }
    out[f] = v;
  });
  return out;
}

function need(user, perm) {
  if (perm === '__admin' ? user.role !== 'admin' : !can(user, perm)) throw new HttpError(403, "Vous n'avez pas l'autorisation pour cette action.");
}

async function uniqueSlug(table, base, exceptId) {
  let slug = C.slugify(base), i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const row = await db.one(table, 'select=id&slug=eq.' + enc(slug));
    if (!row || row.id === exceptId) return slug;
    i += 1; slug = C.slugify(base) + '-' + i;
  }
}

async function dashboard(user) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const [settings, reals, arts, donations, pendingComments, totalComments, unread, subs, metrics, recent, teamCount, galleryCount] = await Promise.all([
    C.getSettings(),
    db.select('realisations', 'select=id,title,slug,views,likes,published&order=views.desc'),
    db.select('articles', 'select=id,title,slug,views,likes,published&order=views.desc'),
    can(user, 'donations') ? db.select('donations', 'select=amount,currency,status,created_at,network&order=created_at.desc&limit=2000') : Promise.resolve([]),
    db.count('comments', 'status=eq.pending'),
    db.count('comments'),
    db.count('messages', 'read=eq.false&archived=eq.false'),
    db.count('subscribers', 'active=eq.true'),
    db.select('impact_metrics', 'select=*&published=eq.true&order=sort.asc'),
    db.select('comments', 'select=id,author_name,content,target_type,status,created_at&order=created_at.desc&limit=6'),
    db.count('team', 'published=eq.true'),
    db.count('gallery')
  ]);
  const sum = (arr, k) => arr.reduce((s, x) => s + (Number(x[k]) || 0), 0);
  const ok = donations.filter(d => d.status === 'success');
  const byCurrency = {};
  ok.forEach(d => { byCurrency[d.currency] = (byCurrency[d.currency] || 0) + Number(d.amount); });
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    months.push({ month: key, CDF: 0, USD: 0, count: 0 });
  }
  ok.forEach(d => {
    const m = months.find(x => x.month === String(d.created_at).slice(0, 7));
    if (m) { m[d.currency] += Number(d.amount); m.count += 1; }
  });
  const networks = { orange: 0, mpesa: 0, airtel: 0 };
  ok.forEach(d => { networks[d.network] = (networks[d.network] || 0) + 1; });
  const pct = metrics.length ? metrics.reduce((s, m) => s + Math.min(100, (Number(m.value) / (Number(m.target) || 1)) * 100), 0) / metrics.length : 0;
  return {
    founded_at: (settings.general || {}).founded_at,
    counts: {
      realisations: reals.length, articles: arts.length, gallery: galleryCount, team: teamCount, subscribers: subs,
      comments: totalComments, pending_comments: pendingComments, unread_messages: unread,
      views: sum(reals, 'views') + sum(arts, 'views'), likes: sum(reals, 'likes') + sum(arts, 'likes')
    },
    donations: can(user, 'donations') ? {
      total_by_currency: byCurrency, success_count: ok.length,
      pending_count: donations.filter(d => d.status === 'pending').length,
      failed_count: donations.filter(d => d.status === 'failed').length,
      this_month: ok.filter(d => d.created_at >= monthStart).length,
      months, networks
    } : null,
    top: {
      realisations: reals.slice(0, 5),
      articles: arts.slice(0, 5)
    },
    impact: { metrics, percent: Math.round(pct * 10) / 10 },
    recent_comments: recent
  };
}

module.exports = C.handler(async (req) => {
  const user = await C.authenticate(req, 'session');
  C.requireReady(user);
  const r = String(req.query.r || '');
  const id = req.query.id ? String(req.query.id) : '';
  const b = C.body(req);

  /* ---------- Tableau de bord ---------- */
  if (r === 'dashboard') return dashboard(user);

  /* ---------- Recherche globale (barre du haut) ---------- */
  if (r === 'search') {
    const q = C.str(req.query.q, 80).replace(/[(),*]/g, ' ').trim();
    if (q.length < 2) return { groups: [] };
    const like = f => f + '.ilike.*' + enc(q) + '*';
    const S = [
      ['realisations', 'realisations', 'Réalisations', 'id,title,category,image', ['title', 'category', 'summary', 'slug'], x => [x.title, x.category, x.image]],
      ['articles', 'articles', 'Actualités', 'id,title,category,image', ['title', 'category', 'excerpt', 'slug'], x => [x.title, x.category, x.image]],
      ['gallery', 'gallery', 'Galerie', 'id,title,label,image', ['title', 'label', 'description', 'theme'], x => [x.title, x.label, x.image]],
      ['team', 'team', 'Équipe', 'id,name,role,photo', ['name', 'role'], x => [x.name, x.role, x.photo]],
      ['partners', 'partners', 'Partenaires', 'id,name,url,logo', ['name', 'url'], x => [x.name, x.url, x.logo]],
      ['testimonials', 'testimonials', 'Témoignages', 'id,name,role,photo', ['name', 'role', 'content'], x => [x.name, x.role, x.photo]],
      ['impact', 'impact_metrics', 'Impact', 'id,label,value,target,unit', ['label'], x => [x.label, x.value + ' / ' + x.target + ' ' + (x.unit || '')]],
      ['comments', 'comments', 'Commentaires', 'id,author_name,content,status', ['author_name', 'content'], x => [x.author_name, String(x.content).slice(0, 90)]],
      ['messages', 'messages', 'Messages', 'id,name,subject,email', ['name', 'email', 'subject', 'content'], x => [x.name, x.subject || x.email]],
      ['subscribers', 'subscribers', 'Abonnés', 'id,email,active', ['email'], x => [x.email, x.active ? 'Actif' : 'Désinscrit']],
      ['donations', 'donations', 'Dons', 'id,reference,donor_name,amount,currency,status', ['reference', 'donor_name', 'phone'], x => [x.donor_name || x.reference, x.amount + ' ' + x.currency + ' · ' + x.status]]
    ];
    const perm = { realisations: 'realisations', articles: 'articles', gallery: 'gallery', team: 'team', partners: 'partners', testimonials: 'testimonials', impact: 'impact', comments: 'comments', messages: 'messages', subscribers: 'subscribers', donations: 'donations' };
    const groups = await Promise.all(S.filter(d => can(user, perm[d[0]])).map(async d => {
      try {
        const res = await C.rest('GET', d[1] + '?select=' + d[3] + '&or=(' + d[4].map(like).join(',') + ')&limit=6', { prefer: 'count=exact', withCount: true });
        return { key: d[0], label: d[2], total: res.count, items: (res.data || []).map(x => { const v = d[5](x); return { id: x.id, title: v[0], sub: v[1] || '', image: v[2] || null }; }) };
      } catch (e) { return null; }
    }));
    if (user.role === 'admin') {
      const us = await db.select('users', 'select=id,name,email&or=(' + ['name', 'email'].map(like).join(',') + ')&limit=6');
      if (us.length) groups.push({ key: 'users', label: 'Utilisateurs', total: us.length, items: us.map(u => ({ id: u.id, title: u.name, sub: u.email })) });
    }
    return { groups: groups.filter(g => g && g.items.length) };
  }

  /* ---------- Paramètres (coordonnées, accueil, général) ---------- */
  if (r === 'settings') {
    const key = String(req.query.key || '');
    const allowed = { contact: 'settings', general: 'settings', latest_activity: 'home', home: 'home', payments: '__admin' };
    if (req.method === 'GET') {
      const all = await C.getSettings();
      const out = {};
      Object.keys(allowed).forEach(k => { if (allowed[k] === '__admin' ? user.role === 'admin' : can(user, allowed[k])) out[k] = all[k] || {}; });
      return { settings: out };
    }
    if (!allowed[key]) throw new HttpError(400, 'Paramètre inconnu.');
    need(user, allowed[key]);
    if (!b.value || typeof b.value !== 'object') throw new HttpError(400, 'Valeur invalide.');
    const row = await db.upsert('settings', { key, value: b.value, updated_at: new Date().toISOString() }, 'key');
    await C.audit(user, 'update', 'settings', key);
    return { setting: row[0] };
  }

  /* ---------- Téléversement de médias ---------- */
  if (r === 'upload') {
    if (!(can(user, 'media') || ['realisations', 'articles', 'gallery', 'team', 'partners', 'testimonials', 'home'].some(p => can(user, p)))) need(user, 'media');
    const name = C.str(b.filename, 200) || 'fichier';
    const type = C.str(b.contentType, 100);
    if (!/^(image\/(jpeg|png|webp|gif|svg\+xml)|video\/mp4)$/.test(type)) throw new HttpError(400, 'Format non accepté (JPG, PNG, WEBP, GIF, SVG ou MP4).');
    const ext = (name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
    const folder = C.slugify(C.str(b.folder, 40) || 'divers');
    const path = folder + '/' + new Date().toISOString().slice(0, 10) + '-' + Date.now().toString(36) + '-' + C.slugify(name.replace(/\.[^.]+$/, '')).slice(0, 40) + '.' + ext;
    return C.signedUpload(path);
  }
  if (r === 'media') {
    need(user, 'media');
    if (req.method === 'GET') {
      const folders = ['realisations', 'articles', 'gallery', 'team', 'partners', 'testimonials', 'home', 'divers'];
      const lists = await Promise.all(folders.map(f => C.listMedia(f).catch(() => [])));
      const files = [];
      lists.forEach((l, i) => (l || []).forEach(o => { if (o.name && o.id) files.push({ path: folders[i] + '/' + o.name, url: C.publicUrl(folders[i] + '/' + o.name), size: o.metadata && o.metadata.size, created_at: o.created_at }); }));
      files.sort((a, b2) => String(b2.created_at).localeCompare(String(a.created_at)));
      return { files };
    }
    if (req.method === 'DELETE') {
      need(user, 'delete');
      const path = C.str(req.query.path, 300);
      if (!path || path.includes('..')) throw new HttpError(400, 'Chemin invalide.');
      await C.deleteMedia([path]);
      await C.audit(user, 'delete', 'media', path);
      return { ok: true };
    }
  }

  /* ---------- Réponse à un commentaire (au nom de l'association) ---------- */
  if (r === 'comment-reply' && req.method === 'POST') {
    need(user, 'comments');
    const parent = await db.one('comments', 'select=*&id=eq.' + enc(String(b.parent_id || '')));
    if (!parent) throw new HttpError(404, 'Commentaire introuvable.');
    const content = C.str(b.content, 3000);
    if (!content) throw new HttpError(400, 'Réponse vide.');
    const contact = await C.getSetting('contact');
    const reply = await db.insert('comments', {
      target_type: parent.target_type, target_id: parent.target_id, parent_id: parent.parent_id || parent.id,
      author_name: (contact.association_name || 'Mwinue Asimame') + ' · ' + user.name,
      content, status: 'approved', is_staff: true, staff_user_id: user.id
    });
    if (parent.status === 'pending') await db.update('comments', 'id=eq.' + parent.id, { status: 'approved' });
    await C.audit(user, 'reply', 'comments', reply.id);
    return { comment: reply };
  }

  /* ---------- Revérifier un paiement auprès de l'opérateur ---------- */
  if (r === 'donation-check' && req.method === 'POST') {
    need(user, 'donations');
    const d = await db.one('donations', 'select=*&id=eq.' + enc(id));
    if (!d) throw new HttpError(404, 'Don introuvable.');
    const updated = await pay.refresh(d, true);
    await C.audit(user, 'recheck', 'donations', d.id, { status: updated.status });
    return { item: updated };
  }

  /* ---------- Utilisateurs (administrateur uniquement) ---------- */
  if (r === 'users') {
    if (user.role !== 'admin') throw new HttpError(403, 'Seul un administrateur peut gérer les utilisateurs.');
    const cols = 'select=id,name,email,role,permissions,active,last_login_at,created_at,pin_hash';
    if (req.method === 'GET') {
      const rows = await db.select('users', cols + '&order=created_at.asc');
      return { items: rows.map(u => Object.assign({}, u, { pin_hash: undefined, has_pin: !!u.pin_hash })), permissions: C.PERMISSIONS };
    }
    const perms = Array.isArray(b.permissions) ? b.permissions.filter(p => C.PERMISSIONS[p]) : [];
    const role = b.role === 'admin' ? 'admin' : 'communicator';
    if (req.method === 'POST') {
      const name = C.str(b.name, 120), email = C.str(b.email, 200).toLowerCase();
      if (!name || !C.isEmail(email)) throw new HttpError(400, 'Nom et e-mail valides requis.');
      if (typeof b.password !== 'string' || b.password.length < 8) throw new HttpError(400, 'Mot de passe provisoire : 8 caractères minimum.');
      const row = { name, email, role, permissions: perms, active: b.active !== false, password_hash: C.hashSecret(b.password) };
      if (b.pin && /^\d{4,6}$/.test(String(b.pin))) row.pin_hash = C.hashSecret(String(b.pin));
      const u = await db.insert('users', row);
      await C.audit(user, 'create', 'users', u.id, { email, role, permissions: perms });
      return { item: Object.assign({}, u, { password_hash: undefined, pin_hash: undefined }) };
    }
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const target = await db.one('users', 'select=id,role,token_version&id=eq.' + enc(id));
      if (!target) throw new HttpError(404, 'Utilisateur introuvable.');
      const patch = { updated_at: new Date().toISOString() };
      if ('name' in b) patch.name = C.str(b.name, 120);
      if ('email' in b) { const e = C.str(b.email, 200).toLowerCase(); if (!C.isEmail(e)) throw new HttpError(400, 'E-mail invalide.'); patch.email = e; }
      if ('role' in b) patch.role = role;
      if ('permissions' in b) patch.permissions = perms;
      if ('active' in b) patch.active = !!b.active;
      if (b.password) {
        if (String(b.password).length < 8) throw new HttpError(400, 'Mot de passe : 8 caractères minimum.');
        patch.password_hash = C.hashSecret(String(b.password));
        patch.token_version = (target.token_version || 0) + 1;
      }
      if (b.reset_pin) { patch.pin_hash = null; patch.pin_attempts = 0; }
      if (target.id === user.id && (patch.role === 'communicator' || patch.active === false)) throw new HttpError(400, 'Vous ne pouvez pas retirer vos propres droits administrateur.');
      if (patch.active === false || patch.role || patch.permissions) patch.token_version = (target.token_version || 0) + 1;
      const u = await db.update('users', 'id=eq.' + enc(id), patch);
      await C.audit(user, 'update', 'users', id, { fields: Object.keys(patch) });
      return { item: Object.assign({}, u, { password_hash: undefined, pin_hash: undefined }) };
    }
    if (req.method === 'DELETE') {
      if (id === user.id) throw new HttpError(400, 'Vous ne pouvez pas supprimer votre propre compte.');
      await db.remove('users', 'id=eq.' + enc(id));
      await C.audit(user, 'delete', 'users', id);
      return { ok: true };
    }
  }

  /* ---------- CRUD générique ---------- */
  const cfg = RESOURCES[r];
  if (!cfg) throw new HttpError(404, 'Ressource inconnue.');
  need(user, cfg.perm);

  if (req.method === 'GET') {
    if (id) {
      const item = await db.one(cfg.table, 'select=*&id=eq.' + enc(id));
      if (!item) throw new HttpError(404, 'Élément introuvable.');
      return { item };
    }
    const limit = Math.min(500, Number(req.query.limit) || 200);
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const filters = [];
    const q = C.str(req.query.q, 100).replace(/[(),*]/g, ' ');
    if (q && cfg.search) filters.push('or=(' + cfg.search.map(f => f + '.ilike.*' + enc(q) + '*').join(',') + ')');
    ['status', 'target_type', 'read', 'archived', 'published', 'network', 'currency', 'category', 'active', 'action'].forEach(f => {
      if (req.query[f] !== undefined && req.query[f] !== '') filters.push(f + '=eq.' + enc(String(req.query[f])));
    });
    const res = await C.rest('GET', cfg.table + '?select=*' + (filters.length ? '&' + filters.join('&') : '') + '&order=' + cfg.order + '&limit=' + limit + '&offset=' + offset, { prefer: 'count=exact', withCount: true });
    let items = res.data || [];
    if (r === 'comments' && items.length) {
      const ids = (t) => [...new Set(items.filter(c => c.target_type === t && c.target_id).map(c => c.target_id))];
      const [rs, as] = await Promise.all([
        ids('realisation').length ? db.select('realisations', 'select=id,title,slug&id=in.(' + ids('realisation').join(',') + ')') : [],
        ids('article').length ? db.select('articles', 'select=id,title,slug&id=in.(' + ids('article').join(',') + ')') : []
      ]);
      const map = {}; rs.concat(as).forEach(x => { map[x.id] = x; });
      items = items.map(c => Object.assign({}, c, { target: map[c.target_id] || null }));
    }
    return { items, total: res.count };
  }

  if (cfg.readOnly) throw new HttpError(405, 'Lecture seule.');

  if (req.method === 'POST') {
    if (cfg.noCreate) throw new HttpError(405, 'Création non autorisée ici.');
    const row = clean(cfg, b);
    if (cfg.publishable && !can(user, 'publish')) row.published = false;
    if (cfg.slug) row.slug = await uniqueSlug(cfg.table, row.slug || row.title);
    if (cfg.author) row.author_id = user.id;
    if (cfg.table === 'subscribers' && !C.isEmail(row.email || '')) throw new HttpError(400, 'E-mail invalide.');
    const item = await db.insert(cfg.table, row);
    await C.audit(user, 'create', cfg.table, item.id, { title: row.title || row.name || row.label || row.email });
    return { item };
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (!C.isUuid(id)) throw new HttpError(400, 'Identifiant invalide.');
    const patch = clean(cfg, b);
    if (cfg.publishable && 'published' in patch && !can(user, 'publish')) delete patch.published;
    if (cfg.slug && 'slug' in patch) patch.slug = await uniqueSlug(cfg.table, patch.slug || patch.title || 'element', id);
    if (r === 'comments' && patch.status && !['approved', 'pending', 'hidden'].includes(patch.status)) throw new HttpError(400, 'Statut invalide.');
    if (r === 'donations' && patch.status && !['pending', 'success', 'failed', 'cancelled'].includes(patch.status)) throw new HttpError(400, 'Statut invalide.');
    if (!['comments', 'messages', 'subscribers'].includes(r)) patch.updated_at = new Date().toISOString();
    const item = await db.update(cfg.table, 'id=eq.' + enc(id), patch);
    if (!item) throw new HttpError(404, 'Élément introuvable.');
    await C.audit(user, 'update', cfg.table, id, { fields: Object.keys(patch) });
    return { item };
  }

  if (req.method === 'DELETE') {
    if (cfg.noDelete) throw new HttpError(405, 'Les dons ne peuvent pas être supprimés (traçabilité).');
    if (!can(user, 'delete')) throw new HttpError(403, "Vous n'avez pas l'autorisation de supprimer.");
    if (!C.isUuid(id)) throw new HttpError(400, 'Identifiant invalide.');
    await db.remove(cfg.table, 'id=eq.' + enc(id));
    if (r === 'realisations' || r === 'articles') {
      const t = r === 'realisations' ? 'realisation' : 'article';
      await db.remove('comments', 'target_type=eq.' + t + '&target_id=eq.' + enc(id)).catch(() => {});
      await db.remove('likes', 'target_type=eq.' + t + '&target_id=eq.' + enc(id)).catch(() => {});
    }
    await C.audit(user, 'delete', cfg.table, id);
    return { ok: true };
  }

  throw new HttpError(405, 'Méthode non autorisée.');
});
