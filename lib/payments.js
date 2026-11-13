'use strict';
/* =====================================================
   Paiements Mobile Money RDC via l'agrégateur FlexPay
   (Orange Money, M-Pesa Vodacom, Airtel Money — CDF ou USD).
   Le client confirme le paiement sur son téléphone avec SON code PIN :
   le site ne voit et ne stocke jamais ce code.
   ===================================================== */
const C = require('./core');
const { db, enc, HttpError } = C;

const CFG = {
  token: process.env.FLEXPAY_TOKEN || '',
  merchant: process.env.FLEXPAY_MERCHANT || '',
  paymentUrl: process.env.FLEXPAY_PAYMENT_URL || 'https://backend.flexpay.cd/api/rest/v1/paymentService',
  checkUrl: (process.env.FLEXPAY_CHECK_URL || 'https://apicheck.flexpaie.com/api/rest/v1/check').replace(/\/+$/, '')
};
const configured = () => !!(CFG.token && CFG.merchant);

// Préfixes des réseaux en RDC (après l'indicatif 243)
const PREFIXES = {
  mpesa: ['81', '82', '83'],
  airtel: ['97', '98', '99'],
  orange: ['80', '84', '85', '89']
};
const NETWORK_NAMES = { orange: 'Orange Money', mpesa: 'M-Pesa', airtel: 'Airtel Money' };

function normalizePhone(input) {
  let p = String(input || '').replace(/[^\d+]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('00')) p = p.slice(2);
  if (p.startsWith('0')) p = '243' + p.slice(1);
  if (p.length === 9) p = '243' + p;
  if (!/^243\d{9}$/.test(p)) throw new HttpError(400, 'Numéro invalide. Exemple : 0812345678 ou +243812345678.');
  return p;
}
function detectNetwork(phone) {
  const pre = phone.slice(3, 5);
  return Object.keys(PREFIXES).find(n => PREFIXES[n].includes(pre)) || null;
}

async function flexFetch(url, opts) {
  const res = await fetch(url, Object.assign({
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + CFG.token }
  }, opts));
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

/* Lance la demande de paiement : l'opérateur envoie une notification sur le téléphone du donateur */
async function initiate(donation, callbackUrl) {
  if (!configured()) throw new HttpError(503, 'Le paiement Mobile Money n’est pas encore activé (identifiants FlexPay manquants).');
  const payload = {
    merchant: CFG.merchant,
    type: '1',
    phone: donation.phone,
    reference: donation.reference,
    amount: String(donation.amount),
    currency: donation.currency,
    callbackUrl
  };
  let r;
  try {
    r = await flexFetch(CFG.paymentUrl, { method: 'POST', body: JSON.stringify(payload) });
  } catch (e) {
    r = { ok: false, status: 0, data: { message: 'Opérateur injoignable : ' + e.message } };
  }
  const code = r.data && r.data.code !== undefined ? String(r.data.code) : '';
  if (r.ok && code === '0' && r.data.orderNumber) {
    return db.update('donations', 'id=eq.' + donation.id, {
      provider_order: String(r.data.orderNumber), provider_message: r.data.message || 'Demande envoyée',
      raw: { init: r.data }, updated_at: new Date().toISOString()
    });
  }
  const msg = (r.data && (r.data.message || r.data.error)) || ('Échec de la demande (HTTP ' + r.status + ')');
  await db.update('donations', 'id=eq.' + donation.id, { status: 'failed', provider_message: msg, raw: { init: r.data }, updated_at: new Date().toISOString() });
  throw new HttpError(502, 'La demande de paiement a été refusée : ' + msg);
}

/* Interroge FlexPay pour connaître l'état réel d'une transaction */
async function check(orderNumber) {
  if (!configured() || !orderNumber) return null;
  try {
    const r = await flexFetch(CFG.checkUrl + '/' + encodeURIComponent(orderNumber), { method: 'GET' });
    if (!r.ok || !r.data) return null;
    const t = r.data.transaction || r.data.data || null;
    if (String(r.data.code) !== '0' || !t) return { status: 'unknown', raw: r.data };
    const s = String(t.status);
    // FlexPay : 0 = succès, 1 = échec, 2 = en attente
    const status = s === '0' ? 'success' : s === '1' ? 'failed' : 'pending';
    return { status, providerReference: t.provider_reference || t.providerReference || null, message: r.data.message, raw: t };
  } catch (e) { return null; }
}

/* Met à jour un don à partir de la vérification opérateur */
async function refresh(donation, force) {
  if (!donation || donation.status !== 'pending' && !force) return donation;
  if (!donation.provider_order) return donation;
  const age = Date.now() - new Date(donation.created_at).getTime();
  if (!force && age < 8000) return donation;
  const r = await check(donation.provider_order);
  if (!r || r.status === 'unknown') {
    if (donation.status === 'pending' && age > 60 * 60 * 1000) {
      return db.update('donations', 'id=eq.' + donation.id, { status: 'failed', provider_message: 'Expiré sans confirmation', updated_at: new Date().toISOString() });
    }
    return donation;
  }
  if (r.status === donation.status) return donation;
  return db.update('donations', 'id=eq.' + donation.id, {
    status: r.status, provider_reference: r.providerReference || donation.provider_reference,
    provider_message: r.message || donation.provider_message,
    raw: Object.assign({}, donation.raw || {}, { check: r.raw }), updated_at: new Date().toISOString()
  });
}

async function byReference(ref) {
  return db.one('donations', 'select=*&reference=eq.' + enc(ref));
}

module.exports = { configured, normalizePhone, detectNetwork, initiate, check, refresh, byReference, NETWORK_NAMES, PREFIXES };
