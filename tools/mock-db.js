'use strict';
// Base PostgREST + Storage + FlexPay simulée en mémoire (tests locaux uniquement)
const crypto = require('crypto');

const T = { settings: [], users: [], realisations: [], articles: [], gallery: [], team: [], partners: [], testimonials: [], impact_metrics: [], comments: [], likes: [], views: [], donations: [], messages: [], subscribers: [], audit_log: [] };
const UNIQUE = { users: ['email'], realisations: ['slug'], articles: ['slug'], subscribers: ['email'], settings: ['key'], donations: ['reference'], likes: ['target_type', 'target_id', 'visitor_id'], views: ['target_type', 'target_id', 'visitor_id', 'day'] };
let seq = 1;
const now = () => new Date().toISOString();
function defaults(t, r) {
  const d = { id: t === 'likes' || t === 'views' || t === 'audit_log' ? seq++ : crypto.randomUUID(), created_at: now() };
  if (['realisations', 'articles'].includes(t)) Object.assign(d, { views: 0, likes: 0, published: true, sort: 0, intro: [], features: [], steps: [], questions: [], gallery: [], tags: [], paragraphs: [] });
  if (t === 'articles') d.published_at = now();
  if (['gallery', 'team', 'partners', 'testimonials', 'impact_metrics'].includes(t)) Object.assign(d, { published: true, sort: 0 });
  if (t === 'comments') Object.assign(d, { status: 'approved', likes: 0, is_staff: false, parent_id: null });
  if (t === 'users') Object.assign(d, { active: true, token_version: 0, pin_attempts: 0, permissions: [], role: 'communicator' });
  if (t === 'messages') Object.assign(d, { read: false, archived: false });
  if (t === 'subscribers') d.active = true;
  if (t === 'views') d.day = now().slice(0, 10);
  if (t === 'donations') Object.assign(d, { status: 'pending' });
  return Object.assign(d, r);
}
function cmp(v, op, raw) {
  const val = decodeURIComponent(raw);
  const s = v === null || v === undefined ? null : String(v);
  switch (op) {
    case 'eq': return val === 'true' ? v === true : val === 'false' ? v === false : s === val;
    case 'neq': return s !== val;
    case 'gte': return s !== null && s >= val;
    case 'lte': return s !== null && s <= val;
    case 'in': return val.replace(/^\(|\)$/g, '').split(',').includes(s);
    case 'ilike': { const re = new RegExp('^' + val.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i'); return s !== null && re.test(s); }
  }
  throw new Error('op ' + op);
}
function filter(rows, params) {
  return rows.filter(r => {
    for (const [k, v] of params) {
      if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(k)) continue;
      if (k === 'or') {
        const parts = decodeURIComponent(v).replace(/^\(|\)$/g, '').split(',');
        if (!parts.some(p => { const [f, op, ...rest] = p.split('.'); return cmp(r[f], op, encodeURIComponent(rest.join('.'))); })) return false;
        continue;
      }
      const i = v.indexOf('.');
      if (!cmp(r[k], v.slice(0, i), v.slice(i + 1))) return false;
    }
    return true;
  });
}
function parse(qs) { return qs ? qs.split('&').map(p => { const i = p.indexOf('='); return [p.slice(0, i), p.slice(i + 1)]; }) : []; }
function resp(status, body, headers) {
  return { ok: status < 400, status, headers: { get: k => (headers || {})[k.toLowerCase()] || null }, text: async () => body === undefined ? '' : JSON.stringify(body), json: async () => body };
}
const flexCalls = [];
global.fetch = async (url, opts = {}) => {
  opts.method = opts.method || 'GET';
  if (url.startsWith('https://backend.flexpay.cd')) { flexCalls.push(JSON.parse(opts.body)); return resp(200, { code: '0', message: 'Transaction envoyée', orderNumber: 'ORD' + flexCalls.length }); }
  if (url.startsWith('https://apicheck.flexpaie.com')) return resp(200, { code: '0', message: 'ok', transaction: { status: '0', provider_reference: 'OPREF1' } });
  const u = new URL(url);
  if (u.pathname.startsWith('/storage/v1/object/upload/sign/')) return resp(200, { url: '/object/upload/sign/media/x.jpg?token=abc' });
  const path = u.pathname.replace('/rest/v1/', '');
  const params = parse(u.search.slice(1));
  const prefer = (opts.headers && opts.headers.Prefer) || '';
  if (path === 'rpc/bump_counter') {
    const b = JSON.parse(opts.body); const row = T[b.p_table].find(r => r.id === b.p_id);
    if (!row) return resp(200, 0); row[b.p_column] = Math.max(0, row[b.p_column] + b.p_delta); return resp(200, row[b.p_column]);
  }
  const table = T[path]; if (!table) return resp(404, { message: 'no table ' + path });
  if (opts.method === 'GET') {
    let rows = filter(table, params);
    const order = (params.find(p => p[0] === 'order') || [])[1];
    if (order) {
      const keys = order.split(',').map(o => o.split('.'));
      rows = rows.slice().sort((a, b) => { for (const [k, dir] of keys) { const x = a[k], y = b[k]; if (x === y) continue; const c = x === null || x === undefined ? 1 : y === null || y === undefined ? -1 : (x > y ? 1 : -1); return dir === 'desc' ? -c : c; } return 0; });
    }
    const total = rows.length;
    const off = Number((params.find(p => p[0] === 'offset') || [])[1] || 0), lim = Number((params.find(p => p[0] === 'limit') || [])[1] || 1e9);
    return resp(200, rows.slice(off, off + lim).map(r => Object.assign({}, r)), { 'content-range': '0-0/' + total });
  }
  if (opts.method === 'POST') {
    const body = JSON.parse(opts.body); const rows = Array.isArray(body) ? body : [body];
    const out = [];
    for (const r of rows) {
      const uniq = UNIQUE[path];
      const existing = uniq && table.find(x => uniq.every(k => String(x[k]) === String(r[k] !== undefined ? r[k] : (k === 'day' ? now().slice(0, 10) : undefined))));
      if (existing) {
        if (prefer.includes('ignore-duplicates')) continue;
        if (prefer.includes('merge-duplicates')) { Object.assign(existing, r); out.push(existing); continue; }
        return resp(409, { code: '23505', message: 'duplicate' });
      }
      const row = defaults(path, r); table.push(row); out.push(row);
    }
    return resp(201, prefer.includes('return=minimal') ? undefined : out);
  }
  if (opts.method === 'PATCH') { const rows = filter(table, params); const p = JSON.parse(opts.body); rows.forEach(r => Object.assign(r, p)); return resp(200, rows); }
  if (opts.method === 'DELETE') { const rows = filter(table, params); rows.forEach(r => table.splice(table.indexOf(r), 1)); if (path === 'comments') rows.forEach(r => { T.comments.filter(c => c.parent_id === r.id).forEach(c => T.comments.splice(T.comments.indexOf(c), 1)); }); return resp(200, rows); }
};


module.exports = { T, defaults, flexCalls };
