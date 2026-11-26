'use strict';
/* Témoignages anonymes : code de suivi, masquage des lieux, formats publics */
const crypto = require('crypto');
const C = require('./core');

const CATEGORIES = {
  physique: 'Violence physique',
  sexuelle: 'Violence sexuelle',
  psychologique: 'Violence psychologique et émotionnelle',
  economique: 'Violence économique',
  cyber: 'Cyberharcèlement',
  traditionnelle: 'Pratiques traditionnelles néfastes',
  autre: 'Autre'
};
const ROLES = { victime: 'Victime', temoin: 'Témoin' };
const STATUS = { new: 'Reçu', read: 'Lu par notre équipe', answered: 'Réponse disponible', archived: 'Clôturé' };

// Code anonyme MA-XXXX-XXXX (sans caractères ambigus : 0/O, 1/I/L)
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode() {
  const bytes = crypto.randomBytes(8);
  let s = '';
  for (let i = 0; i < 8; i++) s += ALPHA[bytes[i] % ALPHA.length];
  return 'MA-' + s.slice(0, 4) + '-' + s.slice(4);
}
function normalizeCode(v) {
  const s = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = s.startsWith('MA') ? s.slice(2) : s;
  if (body.length !== 8) return null;
  return 'MA-' + body.slice(0, 4) + '-' + body.slice(4);
}
// Seule l'empreinte du code est stockée : personne, même l'équipe, ne peut retrouver le code
function codeHash(code) {
  return crypto.createHmac('sha256', (process.env.AUTH_SECRET || 'mwas') + '|temoignage').update(code).digest('hex');
}
// Limitation anti-abus sans conserver l'adresse IP : empreinte qui change chaque jour
function rateKey(req) {
  const day = new Date().toISOString().slice(0, 10);
  return crypto.createHash('sha256').update(C.clientIp(req) + '|' + day + '|' + (process.env.AUTH_SECRET || 'mwas')).digest('hex').slice(0, 24);
}

/* Masquage des lieux et coordonnées avant publication.
   Aucune ville, aucun quartier, aucune adresse ne doit apparaître sur le site public. */
const PLACES = [
  'Kolwezi', 'Lualaba', 'Likasi', 'Lubumbashi', 'Kinshasa', 'Fungurume', 'Mutshatsha', 'Dilolo', 'Kasaji', 'Sandoa', 'Kapanga', 'Lubudi',
  'Manika', 'Dilala', 'Kanina', 'Kasulo', 'Mutoshi', 'Musonoie', 'Luilu', 'Kapata', 'Kandanda', 'Tshala', 'Kingeta', 'Golf', 'Biashara',
  'Haut-Katanga', 'Katanga', 'Kasumbalesa', 'Kipushi', 'Kambove', 'Kakanda', 'Musompo', 'Kasonga', 'Mwangeji', 'Katanga'
];
const PLACE_RE = new RegExp('\\b(' + PLACES.map(p => p.replace(/[-]/g, '[- ]?')).join('|') + ')\\b', 'gi');
const ADDR_RE = /\b(quartier|q\.|avenue|av\.|rue|boulevard|bd|commune|cité|cite|village|localité|localite|territoire|ville|province|n°|numéro|numero|parcelle|chez)\s+(de\s+|du\s+|des\s+|d['’]\s*)?[A-ZÉÈÀÂÎÔÛ0-9][\w'’\-À-ÿ]*(\s+[A-ZÉÈÀÂÎÔÛ][\w'’\-À-ÿ]*)*/gi;
const PHONE_RE = /(\+?\d[\d\s.\-]{7,}\d)/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
function maskPlaces(text) {
  return String(text || '')
    .replace(EMAIL_RE, '[coordonnée masquée]')
    .replace(PHONE_RE, '[coordonnée masquée]')
    .replace(ADDR_RE, (m, kw) => kw.charAt(0).toUpperCase() === kw.charAt(0) ? '[Lieu masqué]' : '[lieu masqué]')
    .replace(PLACE_RE, '[lieu masqué]')
    .replace(/(\[lieu masqué\][\s,]*){2,}/gi, '[lieu masqué] ');
}

function publicItem(t) {
  const d = t.published_at || t.created_at;
  return {
    id: t.id,
    role: t.role, role_label: ROLES[t.role] || '',
    category: t.category, category_label: CATEGORIES[t.category] || 'Autre',
    text: maskPlaces(t.public_text || t.content),
    month: d ? String(d).slice(0, 7) : null,
    reply: t.reply && t.reply_public ? maskPlaces(t.reply) : null
  };
}

module.exports = { CATEGORIES, ROLES, STATUS, newCode, normalizeCode, codeHash, rateKey, maskPlaces, publicItem };
