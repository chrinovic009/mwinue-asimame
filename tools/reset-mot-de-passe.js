// Réinitialise UNIQUEMENT le mot de passe d'un compte de l'administration (et, si vous le souhaitez, son code PIN).
// Aucune autre donnée n'est modifiée. Utilise le fichier .env (clé secrète Supabase).
//   Utilisation :  npm run reset-password
//   ou             node tools/reset-mot-de-passe.js adresse@email.org
'use strict';
const fs = require('fs'), path = require('path'), readline = require('readline');
const ROOT = path.join(__dirname, '..');

const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}
require('./dns-secours');
const C = require(path.join(ROOT, 'lib', 'core'));
const { db, enc } = C;

// Une seule interface de saisie ; les mots de passe s'affichent en étoiles
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let muted = false, prompt = '';
rl._writeToOutput = function (s) {
  if (!muted) return rl.output.write(s);
  if (s.includes(prompt)) rl.output.write(prompt + '*'.repeat(rl.line.length));
  else if (s === '\r\n' || s === '\n') rl.output.write(s);
  else rl.output.write('*');
};
const lines = []; let waiting = null;
rl.on('line', l => { if (waiting) { const w = waiting; waiting = null; w(l); } else lines.push(l); });
function ask(question, hidden) {
  return new Promise(resolve => {
    muted = false; prompt = question; rl.output.write(question); muted = !!hidden;
    const done = a => { muted = false; if (hidden && !process.stdin.isTTY) rl.output.write('\n'); resolve(String(a).trim()); };
    if (lines.length) done(lines.shift()); else waiting = done;
  });
}

(async () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('\n✖ Fichier .env incomplet : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont nécessaires.\n'); process.exit(1);
  }
  const users = await db.select('users', 'select=id,name,email,role,active&order=created_at.asc');
  if (!users.length) { console.log('\nAucun compte n’existe encore : connectez-vous avec les identifiants de première connexion.\n'); rl.close(); return; }
  console.log('\n  Comptes de l’administration :');
  users.forEach(u => console.log('   - ' + u.email + '  (' + u.name + ', ' + (u.role === 'admin' ? 'administrateur' : 'communicateur') + (u.active ? '' : ', désactivé') + ')'));
  console.log('');

  const email = (process.argv[2] || await ask('  Adresse e-mail du compte à réinitialiser : ')).toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === email);
  if (!user) { console.error('\n✖ Aucun compte avec cette adresse.\n'); process.exit(1); }

  const pw = await ask('  Nouveau mot de passe (8 caractères minimum) : ', true);
  if (pw.length < 8) { console.error('\n✖ Mot de passe trop court (8 caractères minimum).\n'); process.exit(1); }
  const pw2 = await ask('  Confirmez le mot de passe : ', true);
  if (pw !== pw2) { console.error('\n✖ Les deux mots de passe ne correspondent pas.\n'); process.exit(1); }
  const pin = (await ask('  Réinitialiser aussi le code PIN ? (o/N) : ')).toLowerCase().startsWith('o');

  const cur = await db.one('users', 'select=token_version&id=eq.' + enc(user.id));
  const patch = {
    password_hash: C.hashSecret(pw), pin_attempts: 0,
    token_version: ((cur && cur.token_version) || 0) + 1, updated_at: new Date().toISOString()
  };
  if (pin) patch.pin_hash = null;
  await db.update('users', 'id=eq.' + enc(user.id), patch);
  await C.audit({ id: user.id, name: 'Réinitialisation locale' }, 'reset-password', 'users', user.id, { pin_reset: pin });

  console.log('\n  ✔ Mot de passe de ' + user.email + ' réinitialisé.' + (pin ? ' Le code PIN sera redemandé à la prochaine connexion.' : ''));
  console.log('    Les sessions ouvertes sur ce compte ont été fermées. Aucune autre donnée n’a été modifiée.\n');
  rl.close();
})().catch(e => { console.error('\n✖ Erreur : ' + (e.message || e) + '\n'); process.exit(1); });
