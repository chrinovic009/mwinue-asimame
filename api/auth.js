'use strict';
/* Authentification : création du premier admin, connexion, verrouillage par PIN */
const C = require('../lib/core');
const { db, enc, HttpError } = C;

const SESSION_TTL = 12 * 3600;      // session active : 12 h
const TICKET_TTL = 30 * 24 * 3600;  // ticket de déverrouillage : 30 jours
const MAX_PIN_ATTEMPTS = 5;
const DEFAULT_EMAIL = 'contact@mwas.org';
const DEFAULT_PASSWORD = 'MWAS_FIRSTLOGIN@2026';

function tokensFor(user) {
  const v = user.token_version || 0;
  return {
    session: C.signToken({ uid: user.id, scope: 'session', v }, SESSION_TTL),
    ticket: C.signToken({ uid: user.id, scope: 'lock', v }, TICKET_TTL)
  };
}
const validPin = p => typeof p === 'string' && /^\d{4,6}$/.test(p);
function validPassword(p) {
  if (typeof p !== 'string' || p.length < 8) throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères.');
}

async function tooManyFailures(req) {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const n = await db.count('audit_log', 'action=eq.login_failed&entity_id=eq.' + enc(C.ipHash(req)) + '&created_at=gte.' + enc(since));
  return n >= 10;
}

module.exports = C.handler(async (req) => {
  const a = String(req.query.a || '');
  const b = C.body(req);

  if (a === 'status' && req.method === 'GET') {
    const n = await db.count('users');
    return { first_login: n === 0 };
  }

  if (a === 'login' && req.method === 'POST') {
    if (await tooManyFailures(req)) throw new HttpError(429, 'Trop de tentatives. Réessayez dans 15 minutes.');
    const email = C.str(b.email, 200).toLowerCase();
    // Première connexion : identifiants par défaut, valables uniquement tant qu'aucun compte n'existe
    if (email === DEFAULT_EMAIL && String(b.password || '') === DEFAULT_PASSWORD && (await db.count('users')) === 0) {
      await db.insert('users', {
        name: 'Administrateur MWAS', email: DEFAULT_EMAIL, role: 'admin', permissions: [],
        password_hash: C.hashSecret(DEFAULT_PASSWORD), must_change_credentials: true
      });
    }
    const user = email ? await db.one('users', 'select=*&email=eq.' + enc(email)) : null;
    const ok = user && C.verifySecret(String(b.password || ''), user.password_hash);
    if (!ok || !user.active) {
      await db.insert('audit_log', { action: 'login_failed', entity: 'auth', entity_id: C.ipHash(req), details: { email } }, 'return=minimal');
      throw new HttpError(401, user && !user.active ? 'Ce compte est désactivé.' : 'E-mail ou mot de passe incorrect.');
    }
    const updated = await db.update('users', 'id=eq.' + user.id, { last_login_at: new Date().toISOString(), pin_attempts: 0 });
    await C.audit(user, 'login', 'users', user.id);
    return Object.assign({ user: C.publicUser(updated || user) }, tokensFor(user));
  }

  if (a === 'unlock' && req.method === 'POST') {
    const user = await C.authenticate(req, 'lock');
    if (!user.pin_hash) throw new HttpError(400, 'Aucun code PIN défini. Connectez-vous avec votre mot de passe.');
    const pin = String(b.pin || '');
    if (!validPin(pin) || !C.verifySecret(pin, user.pin_hash)) {
      const attempts = (user.pin_attempts || 0) + 1;
      if (attempts >= MAX_PIN_ATTEMPTS) {
        await db.update('users', 'id=eq.' + user.id, { pin_attempts: 0, token_version: (user.token_version || 0) + 1 });
        await C.audit(user, 'pin_locked_out', 'users', user.id);
        throw new HttpError(401, 'Trop d’essais : la session est fermée. Reconnectez-vous avec votre mot de passe.', { reset: true });
      }
      await db.update('users', 'id=eq.' + user.id, { pin_attempts: attempts });
      throw new HttpError(403, 'Code PIN incorrect. Essais restants : ' + (MAX_PIN_ATTEMPTS - attempts) + '.');
    }
    await db.update('users', 'id=eq.' + user.id, { pin_attempts: 0 });
    return { user: C.publicUser(user), session: tokensFor(user).session };
  }

  // ---- Routes nécessitant une session active ----
  const user = await C.authenticate(req, 'session');

  // Première connexion : changement obligatoire de l'e-mail, du mot de passe et choix du PIN
  if (a === 'first-setup' && req.method === 'POST') {
    if (!user.must_change_credentials) throw new HttpError(400, 'Vos identifiants ont déjà été personnalisés.');
    const name = C.str(b.name, 120) || user.name;
    const email = C.str(b.email, 200).toLowerCase();
    if (!C.isEmail(email)) throw new HttpError(400, 'Adresse e-mail invalide.');
    if (email === DEFAULT_EMAIL) throw new HttpError(400, 'Choisissez une adresse e-mail différente de l’adresse par défaut.');
    validPassword(b.password);
    if (b.password === DEFAULT_PASSWORD) throw new HttpError(400, 'Choisissez un mot de passe différent du mot de passe par défaut.');
    if (b.password2 !== undefined && b.password2 !== b.password) throw new HttpError(400, 'Les deux mots de passe ne correspondent pas.');
    if (!validPin(b.pin)) throw new HttpError(400, 'Le code PIN doit contenir 4 à 6 chiffres.');
    const taken = await db.one('users', 'select=id&email=eq.' + enc(email));
    if (taken && taken.id !== user.id) throw new HttpError(409, 'Cette adresse e-mail est déjà utilisée.');
    const u = await db.update('users', 'id=eq.' + user.id, {
      name, email, password_hash: C.hashSecret(b.password), pin_hash: C.hashSecret(b.pin), pin_attempts: 0,
      must_change_credentials: false, token_version: (user.token_version || 0) + 1, updated_at: new Date().toISOString()
    });
    await C.audit(u, 'first_setup', 'users', u.id);
    return Object.assign({ user: C.publicUser(u) }, tokensFor(u));
  }

  if (a === 'me' && req.method === 'GET') {
    const g = await C.getSetting('general');
    return { user: C.publicUser(user), permissions: C.PERMISSIONS, auto_lock_minutes: Number(g.auto_lock_minutes) || 5 };
  }

  if (a === 'profile' && req.method === 'POST') {
    const name = C.str(b.name, 120);
    if (!name) throw new HttpError(400, 'Nom requis.');
    const u = await db.update('users', 'id=eq.' + user.id, { name, updated_at: new Date().toISOString() });
    return { user: C.publicUser(u) };
  }

  if (a === 'set-pin' && req.method === 'POST') {
    if (!validPin(b.pin)) throw new HttpError(400, 'Le code PIN doit contenir 4 à 6 chiffres.');
    const full = await db.one('users', 'select=password_hash,pin_hash&id=eq.' + user.id);
    if (full.pin_hash && !C.verifySecret(String(b.password || ''), full.password_hash)) throw new HttpError(403, 'Mot de passe actuel incorrect.');
    await db.update('users', 'id=eq.' + user.id, { pin_hash: C.hashSecret(b.pin), pin_attempts: 0, updated_at: new Date().toISOString() });
    await C.audit(user, 'pin_changed', 'users', user.id);
    return { ok: true };
  }

  if (a === 'change-password' && req.method === 'POST') {
    const full = await db.one('users', 'select=password_hash&id=eq.' + user.id);
    if (!C.verifySecret(String(b.current || ''), full.password_hash)) throw new HttpError(403, 'Mot de passe actuel incorrect.');
    validPassword(b.password);
    const v = (user.token_version || 0) + 1;
    const u = await db.update('users', 'id=eq.' + user.id, { password_hash: C.hashSecret(b.password), token_version: v, updated_at: new Date().toISOString() });
    await C.audit(user, 'password_changed', 'users', user.id);
    return Object.assign({ user: C.publicUser(u) }, tokensFor(u));
  }

  if (a === 'logout-all' && req.method === 'POST') {
    await db.update('users', 'id=eq.' + user.id, { token_version: (user.token_version || 0) + 1 });
    await C.audit(user, 'logout_all', 'users', user.id);
    return { ok: true };
  }

  throw new HttpError(404, 'Action inconnue.');
});
