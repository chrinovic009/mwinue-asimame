'use strict';
/* Rappel (callback) de FlexPay après confirmation ou échec du paiement.
   Sécurité : l'URL porte une signature HMAC propre à chaque don, et l'état
   est revérifié auprès de FlexPay avant d'être enregistré. */
const C = require('../lib/core');
const pay = require('../lib/payments');
const { db } = C;

module.exports = C.handler(async (req) => {
  const ref = C.str(req.query.ref, 60);
  const sig = C.str(req.query.sig, 100);
  if (!ref || sig !== C.sign('cb:' + ref)) return { ok: false };
  const d = await pay.byReference(ref);
  if (!d) return { ok: false };

  const b = C.body(req);
  const raw = Object.assign({}, d.raw || {}, { callback: b });
  const verified = d.provider_order ? await pay.check(d.provider_order) : null;

  let status = d.status;
  if (verified && verified.status !== 'unknown') status = verified.status;
  else if (b && b.code !== undefined) status = String(b.code) === '0' ? 'success' : 'failed';

  await db.update('donations', 'id=eq.' + d.id, {
    status,
    provider_reference: (verified && verified.providerReference) || b.provider_reference || d.provider_reference,
    provider_message: b.message || (verified && verified.message) || d.provider_message,
    raw, updated_at: new Date().toISOString()
  });
  await C.audit(null, 'donation_callback', 'donations', d.id, { status });
  return { ok: true };
});
