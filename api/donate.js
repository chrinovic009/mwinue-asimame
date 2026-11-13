'use strict';
/* Dons : création d'une demande de paiement Mobile Money et suivi de son état */
const crypto = require('crypto');
const C = require('../lib/core');
const pay = require('../lib/payments');
const { db, HttpError } = C;

const PURPOSES = {
  priorities: 'Les actions prioritaires de l’association',
  health: 'La santé et le bien-être des femmes',
  rights: 'La défense des droits des femmes',
  training: 'La formation et l’autonomisation'
};

function publicDonation(d) {
  return {
    reference: d.reference, status: d.status, amount: Number(d.amount), currency: d.currency,
    network: d.network, network_name: pay.NETWORK_NAMES[d.network], message: d.provider_message,
    created_at: d.created_at
  };
}

module.exports = C.handler(async (req) => {
  if (req.method === 'GET') {
    if (req.query.config !== undefined) {
      const g = await C.getSetting('general');
      return {
        enabled: pay.configured(),
        min_cdf: Number(g.donation_min_cdf) || 1000,
        min_usd: Number(g.donation_min_usd) || 1,
        amounts: Array.isArray(g.donation_amounts) ? g.donation_amounts : [10000, 25000, 50000, 100000],
        prefixes: pay.PREFIXES
      };
    }
    const ref = C.str(req.query.ref, 60);
    const key = C.str(req.query.key, 100);
    if (!ref || key !== C.sign('don:' + ref)) throw new HttpError(404, 'Don introuvable.');
    let d = await pay.byReference(ref);
    if (!d) throw new HttpError(404, 'Don introuvable.');
    d = await pay.refresh(d, false);
    return { donation: publicDonation(d) };
  }

  if (req.method !== 'POST') throw new HttpError(405, 'Méthode non autorisée.');
  const b = C.body(req);
  if (b.website) throw new HttpError(400, 'Requête refusée.'); // pot de miel anti-robots

  const g = await C.getSetting('general');
  const currency = b.currency === 'USD' ? 'USD' : 'CDF';
  const amount = Number(b.amount);
  const min = currency === 'USD' ? (Number(g.donation_min_usd) || 1) : (Number(g.donation_min_cdf) || 1000);
  if (!Number.isFinite(amount) || amount < min || amount > 100000000) throw new HttpError(400, 'Montant invalide (minimum ' + min + ' ' + (currency === 'USD' ? 'USD' : 'FC') + ').');
  if (currency === 'CDF' && !Number.isInteger(amount)) throw new HttpError(400, 'Le montant en francs congolais doit être un nombre entier.');
  const network = ['orange', 'mpesa', 'airtel'].includes(b.network) ? b.network : null;
  if (!network) throw new HttpError(400, 'Choisissez Orange Money, M-Pesa ou Airtel Money.');
  const phone = pay.normalizePhone(b.phone);
  const detected = pay.detectNetwork(phone);
  if (detected && detected !== network) {
    throw new HttpError(400, 'Ce numéro semble appartenir à ' + pay.NETWORK_NAMES[detected] + '. Vérifiez le réseau choisi.');
  }
  if (!pay.configured()) throw new HttpError(503, 'Le paiement Mobile Money n’est pas encore activé. Contactez l’association pour faire un don.');

  // Limite : 5 demandes par numéro et par heure
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const recent = await db.count('donations', 'phone=eq.' + phone + '&created_at=gte.' + encodeURIComponent(since));
  if (recent >= 5) throw new HttpError(429, 'Trop de demandes pour ce numéro. Réessayez plus tard.');

  const anonymous = b.anonymous !== false && b.anonymous !== 'false';
  const reference = 'MWAS' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString('hex').toUpperCase();
  const donation = await db.insert('donations', {
    reference, phone, network, amount, currency,
    anonymous, donor_name: anonymous ? null : (C.str(b.donor_name, 100) || null),
    donor_email: C.isEmail(C.str(b.email, 200)) ? C.str(b.email, 200) : null,
    purpose: PURPOSES[b.purpose] || PURPOSES.priorities,
    status: 'pending', provider: 'flexpay'
  });

  const callbackUrl = C.origin(req) + '/api/donate-callback?ref=' + encodeURIComponent(reference) + '&sig=' + C.sign('cb:' + reference);
  const updated = await pay.initiate(donation, callbackUrl);
  return {
    donation: publicDonation(updated),
    key: C.sign('don:' + reference),
    message: 'Une demande de paiement a été envoyée sur le ' + phone.replace(/^243/, '0') + '. Confirmez-la sur votre téléphone avec votre code ' + pay.NETWORK_NAMES[network] + '.'
  };
});
