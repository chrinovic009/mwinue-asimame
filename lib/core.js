'use strict';
/* =====================================================
   MWAS — noyau serveur (Vercel Serverless, Node ≥ 20)
   Aucune dépendance npm : fetch + crypto natifs.
   ===================================================== */
const crypto = require('crypto');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AUTH_SECRET = process.env.AUTH_SECRET || '';
const BUCKET = process.env.SUPABASE_BUCKET || 'media';

class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}

function assertConfig() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new HttpError(500, 'Configuration serveur incomplète : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
  if (SERVICE_KEY.startsWith('sb_publishable') || /"role":"anon"/.test(jwtPayload(SERVICE_KEY))) {
    throw new HttpError(500, 'SUPABASE_SERVICE_ROLE_KEY contient la clé PUBLIQUE (publishable/anon). Mettez la clé SECRÈTE : Supabase → Project Settings → API Keys → « Secret keys » (sb_secret_…) ou « service_role ».');
  }
}
function jwtPayload(k) {
  const parts = String(k).split('.');
  if (parts.length !== 3) return '';
  try { return Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); } catch (e) { return ''; }
}
// Les nouvelles clés secrètes (sb_secret_…) ne sont pas des JWT : on les envoie uniquement dans « apikey ».
function authHeaders(extra) {
  const h = Object.assign({ apikey: SERVICE_KEY }, extra || {});
  if (!SERVICE_KEY.startsWith('sb_')) h.Authorization = 'Bearer ' + SERVICE_KEY;
  return h;
}

/* ---------------- Base de données (PostgREST) ---------------- */
async function rest(method, path, opts = {}) {
  assertConfig();
  const headers = authHeaders({
    'Content-Type': 'application/json',
    Prefer: opts.prefer || 'return=representation'
  });
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
  });
  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch (e) { data = text; } }
  if (!res.ok) {
    const msg = (data && (data.message || data.error || data.hint)) || ('Erreur base de données (' + res.status + ')');
    if (res.status === 409 || (data && data.code === '23505')) throw new HttpError(409, 'Cette valeur existe déjà (doublon).', { db: msg });
    throw new HttpError(res.status >= 500 ? 502 : 400, msg);
  }
  if (opts.withCount) {
    const range = res.headers.get('content-range') || '';
    const total = Number(range.split('/')[1]);
    return { data, count: Number.isFinite(total) ? total : (Array.isArray(data) ? data.length : 0) };
  }
  return data;
}
const enc = encodeURIComponent;
const db = {
  select: (table, query = '') => rest('GET', table + (query ? '?' + query : '')),
  one: async (table, query) => { const r = await rest('GET', table + '?' + query + '&limit=1'); return Array.isArray(r) ? r[0] || null : null; },
  count: async (table, query = '') => {
    const r = await rest('GET', table + '?select=id' + (query ? '&' + query : '') + '&limit=1', { prefer: 'count=exact', withCount: true });
    return r.count;
  },
  insert: async (table, row, prefer) => { const r = await rest('POST', table, { body: row, prefer }); return Array.isArray(r) ? r[0] : r; },
  insertIgnore: (table, row, onConflict) => rest('POST', table + (onConflict ? '?on_conflict=' + onConflict : ''), { body: row, prefer: 'resolution=ignore-duplicates,return=representation' }),
  upsert: (table, row, onConflict) => rest('POST', table + (onConflict ? '?on_conflict=' + onConflict : ''), { body: row, prefer: 'resolution=merge-duplicates,return=representation' }),
  update: async (table, filter, patch) => { const r = await rest('PATCH', table + '?' + filter, { body: patch }); return Array.isArray(r) ? r[0] || null : r; },
  remove: (table, filter) => rest('DELETE', table + '?' + filter),
  rpc: (fn, args) => rest('POST', 'rpc/' + fn, { body: args })
};

async function getSetting(key, fallback) {
  const row = await db.one('settings', 'select=value&key=eq.' + enc(key));
  return row ? row.value : (fallback === undefined ? {} : fallback);
}
async function getSettings() {
  const rows = await db.select('settings', 'select=key,value');
  const out = {};
  (rows || []).forEach(r => { out[r.key] = r.value; });
  return out;
}

/* ---------------- Stockage (Supabase Storage) ---------------- */
function publicUrl(path) { return SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + path; }
async function signedUpload(path) {
  assertConfig();
  const res = await fetch(SUPABASE_URL + '/storage/v1/object/upload/sign/' + BUCKET + '/' + path, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: '{}'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new HttpError(502, data.message || 'Impossible de préparer le téléversement.');
  return { uploadUrl: SUPABASE_URL + '/storage/v1' + data.url, publicUrl: publicUrl(path), path };
}
async function listMedia(prefix = '', limit = 200) {
  assertConfig();
  const res = await fetch(SUPABASE_URL + '/storage/v1/object/list/' + BUCKET, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prefix, limit, offset: 0, sortBy: { column: 'created_at', order: 'desc' } })
  });
  const data = await res.json().catch(() => []);
  if (!res.ok) throw new HttpError(502, 'Impossible de lister les médias.');
  return data;
}
async function deleteMedia(paths) {
  assertConfig();
  const res = await fetch(SUPABASE_URL + '/storage/v1/object/' + BUCKET, {
    method: 'DELETE',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prefixes: paths })
  });
  if (!res.ok) throw new HttpError(502, 'Suppression du média impossible.');
  return true;
}

/* ---------------- Mots de passe, PIN, jetons ---------------- */
function hashSecret(secret) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(secret), salt, 64, { N: 16384, r: 8, p: 1 });
  return 'scrypt$' + salt.toString('base64') + '$' + hash.toString('base64');
}
function verifySecret(secret, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1], 'base64');
  const expected = Buffer.from(parts[2], 'base64');
  const actual = crypto.scryptSync(String(secret), salt, expected.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(actual, expected);
}
const b64url = buf => Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const fromB64url = s => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
function requireSecret() {
  if (!AUTH_SECRET || AUTH_SECRET.length < 32) throw new HttpError(500, 'AUTH_SECRET manquant ou trop court (32 caractères minimum).');
}
function hmac(data) { requireSecret(); return b64url(crypto.createHmac('sha256', AUTH_SECRET).update(data).digest()); }
function signToken(payload, ttlSeconds) {
  const body = Object.assign({}, payload, { exp: Math.floor(Date.now() / 1000) + ttlSeconds });
  const part = b64url(JSON.stringify(body));
  return part + '.' + hmac(part);
}
function verifyToken(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') < 0) return null;
  const [part, sig] = token.split('.');
  const expected = hmac(part);
  const a = Buffer.from(sig || ''), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromB64url(part).toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) { return null; }
}
function sign(value) { return hmac('v1:' + value); }

/* ---------------- Permissions ---------------- */
const PERMISSIONS = {
  realisations: 'Réalisations',
  articles: 'Actualités',
  gallery: 'Galerie',
  home: "Page d'accueil (dernière activité)",
  team: 'Équipe',
  partners: 'Partenaires',
  testimonials: 'Témoignages',
  impact: 'Impact (indicateurs)',
  comments: 'Commentaires (modération et réponses)',
  messages: 'Messages de contact',
  subscribers: 'Abonnés newsletter',
  donations: 'Dons et paiements',
  media: 'Médiathèque (téléversement)',
  settings: 'Coordonnées et paramètres du site',
  publish: 'Publier / dépublier',
  delete: 'Supprimer des contenus'
};
function can(user, perm) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return Array.isArray(user.permissions) && user.permissions.indexOf(perm) >= 0;
}

async function loadUser(id) {
  return db.one('users', 'select=id,name,email,role,permissions,active,pin_hash,token_version,pin_attempts,last_login_at,created_at,must_change_credentials&id=eq.' + enc(id));
}
async function authenticate(req, scope = 'session') {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const payload = verifyToken(token);
  if (!payload || payload.scope !== scope) throw new HttpError(401, scope === 'session' ? 'Session expirée ou verrouillée.' : 'Ticket de déverrouillage invalide.');
  const user = await loadUser(payload.uid);
  if (!user || !user.active) throw new HttpError(401, 'Compte désactivé ou introuvable.');
  if ((user.token_version || 0) !== (payload.v || 0)) throw new HttpError(401, 'Session révoquée. Reconnectez-vous.');
  return user;
}
function requireReady(user) {
  if (user.must_change_credentials) throw new HttpError(403, 'Première connexion : modifiez d’abord votre adresse e-mail et votre mot de passe.');
}
function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, permissions: u.role === 'admin' ? Object.keys(PERMISSIONS) : (u.permissions || []), has_pin: !!u.pin_hash, last_login_at: u.last_login_at, must_change_credentials: !!u.must_change_credentials };
}

async function audit(user, action, entity, entityId, details) {
  try {
    await db.insert('audit_log', { user_id: user ? user.id : null, user_name: user ? user.name : 'système', action, entity, entity_id: entityId ? String(entityId) : null, details: details || null }, 'return=minimal');
  } catch (e) { /* le journal ne doit jamais bloquer */ }
}

/* ---------------- HTTP ---------------- */
function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}
function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(data));
}
function handler(fn) {
  return async (req, res) => {
    try {
      const out = await fn(req, res);
      if (!res.writableEnded) send(res, 200, out === undefined ? { ok: true } : out);
    } catch (err) {
      const status = err.status || 500;
      if (status >= 500) console.error('[MWAS API]', err);
      send(res, status, { error: status >= 500 && !err.status ? 'Erreur interne du serveur.' : (err.message || 'Erreur interne') });
    }
  };
}
function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || '').split(',')[0].trim();
}
function ipHash(req) { return crypto.createHash('sha256').update(clientIp(req) + '|' + (AUTH_SECRET || 'mwas')).digest('hex').slice(0, 32); }
function origin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return proto + '://' + req.headers.host;
}

/* ---------------- Validation ---------------- */
function str(v, max = 500) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\u0000/g, '').trim().slice(0, max);
}
const isUuid = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const isEmail = v => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
function slugify(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/['’]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || ('element-' + Date.now());
}

module.exports = {
  HttpError, db, enc, rest, getSetting, getSettings,
  signedUpload, publicUrl, listMedia, deleteMedia,
  hashSecret, verifySecret, signToken, verifyToken, sign,
  PERMISSIONS, can, authenticate, requireReady, loadUser, publicUser, audit,
  body, send, handler, clientIp, ipHash, origin,
  str, isUuid, isEmail, slugify, SUPABASE_URL
};
