import { randomBytes, scryptSync } from 'node:crypto';

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
  throw new Error('Run this command in an interactive terminal so the password can be entered privately.');
}

const input = process.stdin;
const output = process.stdout;
let password = '';

output.write('Nouveau mot de passe administrateur (saisie masquée) : ');
input.setRawMode(true);
input.setEncoding('utf8');
input.resume();

input.on('data', (key) => {
  if (key === '\u0003') {
    output.write('\nAnnulé.\n');
    input.setRawMode(false);
    process.exit(1);
  }
  if (key === '\r' || key === '\n') {
    input.setRawMode(false);
    input.pause();
    output.write('\n');

    if ([...password].length < 12) {
      output.write('Le mot de passe doit contenir au moins 12 caractères.\n');
      process.exitCode = 1;
      return;
    }

    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 64);
    output.write(`${salt.toString('hex')}:${hash.toString('hex')}\n`);
    output.write('Copiez cette empreinte dans ADMIN_PASSWORD_HASH; le mot de passe n’est pas enregistré.\n');
    password = '';
    return;
  }
  if (key === '\u007f' || key === '\b') {
    password = password.slice(0, -1);
    return;
  }
  if (!/[\u0000-\u001f\u007f]/.test(key)) {
    password += key;
  }
});
