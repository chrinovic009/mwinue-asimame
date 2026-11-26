// Lance le site MWAS sur votre ordinateur : node serveur-local.js
// Lit les variables du fichier .env (même contenu que sur Vercel), sert les pages et l'API.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

// Chargement du fichier .env
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} else {
  console.warn('⚠️  Fichier .env introuvable : copiez .env.example en .env et remplissez-le.');
}
if (!process.env.SITE_URL) process.env.SITE_URL = 'http://localhost:' + PORT;


// DNS de secours si le DNS de Windows ne trouve pas Supabase (voir tools/dns-secours.js)
require('./tools/dns-secours');

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.ico': 'image/x-icon', '.mp4': 'video/mp4' };
const API = ['public', 'admin', 'auth', 'donate', 'donate-callback'];

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const name = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');

  if (url.pathname.startsWith('/api/') && API.includes(name)) {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      req.query = Object.fromEntries(url.searchParams);
      try { req.body = raw ? JSON.parse(raw) : {}; } catch (e) { req.body = raw; }
      try { require(path.join(ROOT, 'api', name))(req, res); }
      catch (e) { console.error(e); res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
    });
    return;
  }

  let p = decodeURIComponent(url.pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.end('Page introuvable');
  }
  res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
// Si le port est déjà pris (un ancien serveur encore ouvert), on essaie automatiquement le suivant
let port = Number(PORT), tries = 0;
server.on('error', err => {
  if (err.code === 'EADDRINUSE' && tries < 10) {
    console.log('  Le port ' + port + ' est déjà utilisé (un autre serveur tourne sans doute déjà) → essai du port ' + (port + 1) + '…');
    tries++; port++; setTimeout(() => server.listen(port), 150);
  } else { console.error(err); process.exit(1); }
});
server.on('listening', () => {
  console.log('\n  Site MWAS lancé :');
  console.log('  → Site public      : http://localhost:' + port);
  console.log('  → Administration   : http://localhost:' + port + '/admin/');
  console.log('\n  (Ctrl + C pour arrêter)\n');
});
server.listen(port);
