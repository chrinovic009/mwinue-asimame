// Test d'intégration de l'API avec une base PostgREST simulée en mémoire
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
process.env.AUTH_SECRET = 'x'.repeat(40);
process.env.SETUP_CODE = 'setup-123';
process.env.FLEXPAY_TOKEN = 'tok';
process.env.FLEXPAY_MERCHANT = 'MWAS';
const assert = require('assert');
const { T, defaults, flexCalls } = require('./mock-db');

const handlers = { public: require('../api/public'), admin: require('../api/admin'), auth: require('../api/auth'), donate: require('../api/donate'), cb: require('../api/donate-callback') };
async function call(name, method, query, body, token, headers) {
  const req = { method, query: query || {}, body, headers: Object.assign({ host: 'mwas.test', 'x-forwarded-for': '1.2.3.4' }, token ? { authorization: 'Bearer ' + token } : {}, headers || {}) };
  let out = { status: 200, headers: {} };
  const res = { statusCode: 200, writableEnded: false, setHeader(k, v) { out.headers[k.toLowerCase()] = v; }, getHeader(k) { return out.headers[k.toLowerCase()]; }, end(d) { out.status = this.statusCode; out.body = JSON.parse(d); this.writableEnded = true; } };
  await handlers[name](req, res);
  return out;
}

(async () => {
  // Données de départ
  T.settings.push({ key: 'general', value: { founded_at: '2026-02-01T00:00:00+02:00', comments_moderation: false, auto_lock_minutes: 5 } }, { key: 'contact', value: { association_name: 'Mwinue Asimame', phones: ['+243 819 580 061'] } });
  T.realisations.push(defaults('realisations', { slug: 'octobre-rose', title: 'Octobre Rose', image: 'img/a.png' }));
  T.articles.push(defaults('articles', { slug: 'art-1', title: 'Article 1' }));
  T.impact_metrics.push(defaults('impact_metrics', { label: 'A', value: 60, target: 100 }), defaults('impact_metrics', { label: 'B', value: 300, target: 200 }));

  let r = await call('auth', 'GET', { a: 'status' });
  assert.equal(r.body.first_login, true);
  r = await call('auth', 'POST', { a: 'login' }, { email: 'contact@mwas.org', password: 'mauvais' });
  assert.equal(r.status, 401);
  r = await call('auth', 'POST', { a: 'login' }, { email: 'contact@mwas.org', password: 'MWAS_FIRSTLOGIN@2026' });
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.user.must_change_credentials, true);
  const firstSession = r.body.session;
  r = await call('admin', 'GET', { r: 'dashboard' }, null, firstSession);
  assert.equal(r.status, 403, 'admin bloquée avant personnalisation');
  r = await call('auth', 'POST', { a: 'first-setup' }, { name: 'Admin', email: 'contact@mwas.org', password: 'password1', pin: '1234' }, firstSession);
  assert.equal(r.status, 400, 'même e-mail refusé');
  r = await call('auth', 'POST', { a: 'first-setup' }, { name: 'Admin', email: 'admin@mwas.cd', password: 'MWAS_FIRSTLOGIN@2026', pin: '1234' }, firstSession);
  assert.equal(r.status, 400, 'même mot de passe refusé');
  r = await call('auth', 'POST', { a: 'first-setup' }, { name: 'Admin', email: 'admin@mwas.cd', password: 'password1', password2: 'password1', pin: '1234' }, firstSession);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const adminSession = r.body.session, adminTicket = r.body.ticket;
  r = await call('admin', 'GET', { r: 'dashboard' }, null, firstSession);
  assert.equal(r.status, 401, 'ancienne session révoquée');
  r = await call('auth', 'POST', { a: 'login' }, { email: 'contact@mwas.org', password: 'MWAS_FIRSTLOGIN@2026' });
  assert.equal(r.status, 401, 'identifiants par défaut désactivés');
  assert.equal(T.users.length, 1);
  r = await call('auth', 'POST', { a: 'first-setup' }, { name: 'X', email: 'y@mwas.cd', password: 'password9', pin: '1111' }, adminSession);
  assert.equal(r.status, 400, 'une seule fois');

  // Login
  r = await call('auth', 'POST', { a: 'login' }, { email: 'admin@mwas.cd', password: 'wrong' });
  assert.equal(r.status, 401);
  r = await call('auth', 'POST', { a: 'login' }, { email: 'ADMIN@mwas.cd', password: 'password1' });
  assert.equal(r.status, 200); assert.ok(r.body.user.has_pin);

  // Verrouillage : le ticket ne donne pas accès à l'admin
  r = await call('admin', 'GET', { r: 'dashboard' }, null, adminTicket);
  assert.equal(r.status, 401);
  r = await call('auth', 'POST', { a: 'unlock' }, { pin: '0000' }, adminTicket);
  assert.equal(r.status, 403);
  r = await call('auth', 'POST', { a: 'unlock' }, { pin: '1234' }, adminTicket);
  assert.equal(r.status, 200); const s2 = r.body.session;
  r = await call('admin', 'GET', { r: 'dashboard' }, null, s2);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.impact.percent, 80);

  // Création d'un communicateur sans droit de publier
  r = await call('admin', 'POST', { r: 'users' }, { name: 'Com', email: 'com@mwas.cd', password: 'password2', role: 'communicator', permissions: ['articles', 'comments'] }, adminSession);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  r = await call('auth', 'POST', { a: 'login' }, { email: 'com@mwas.cd', password: 'password2' });
  const com = r.body.session; assert.equal(r.body.user.has_pin, false);
  r = await call('admin', 'POST', { r: 'articles' }, { title: 'Nouvelle actu', published: true, paragraphs: ['a', 'b'] }, com);
  assert.equal(r.status, 200); assert.equal(r.body.item.published, false, 'brouillon forcé'); assert.equal(r.body.item.slug, 'nouvelle-actu');
  r = await call('admin', 'POST', { r: 'realisations' }, { title: 'X' }, com);
  assert.equal(r.status, 403);
  r = await call('admin', 'DELETE', { r: 'articles', id: T.articles[0].id }, null, com);
  assert.equal(r.status, 403);
  r = await call('admin', 'GET', { r: 'users' }, null, com);
  assert.equal(r.status, 403);
  // L'admin publie
  r = await call('admin', 'PUT', { r: 'articles', id: T.articles[1].id }, { published: true }, adminSession);
  assert.equal(r.body.item.published, true);
  // Slug unique
  r = await call('admin', 'POST', { r: 'articles' }, { title: 'Nouvelle actu' }, adminSession);
  assert.equal(r.body.item.slug, 'nouvelle-actu-2');

  // Public
  r = await call('public', 'GET', { r: 'site' });
  assert.equal(r.status, 200); assert.equal(r.body.stats.activities, 1); assert.ok(r.headers['cache-control'].includes('s-maxage'));
  r = await call('public', 'GET', { r: 'articles' });
  assert.equal(r.body.items.length, 3);
  const rid = T.realisations[0].id;
  r = await call('public', 'POST', { r: 'view' }, { type: 'realisation', id: rid, visitor: 'visitor-0001' });
  assert.equal(r.body.views, 1);
  r = await call('public', 'POST', { r: 'view' }, { type: 'realisation', id: rid, visitor: 'visitor-0001' });
  assert.equal(r.body.views, 1, 'une vue par jour et par visiteur');
  r = await call('public', 'POST', { r: 'view' }, { type: 'realisation', id: rid, visitor: 'visitor-0002' });
  assert.equal(r.body.views, 2);
  r = await call('public', 'POST', { r: 'like' }, { type: 'realisation', id: rid, visitor: 'visitor-0001' });
  assert.deepEqual(r.body, { liked: true, likes: 1 });
  r = await call('public', 'POST', { r: 'like' }, { type: 'realisation', id: rid, visitor: 'visitor-0001' });
  assert.deepEqual(r.body, { liked: false, likes: 0 });

  // Commentaires + réponses
  r = await call('public', 'POST', { r: 'comment' }, { type: 'realisation', id: rid, name: 'Marie', content: 'Bravo !', visitor: 'visitor-0001' });
  assert.equal(r.status, 200, JSON.stringify(r.body)); const c1 = r.body.comment.id;
  r = await call('public', 'POST', { r: 'comment' }, { type: 'realisation', id: rid, parent_id: c1, name: 'Paul', content: 'Oui !' });
  assert.equal(r.status, 200);
  r = await call('admin', 'POST', { r: 'comment-reply' }, { parent_id: c1, content: 'Merci Marie' }, adminSession);
  assert.equal(r.status, 200); assert.equal(r.body.comment.is_staff, true);
  r = await call('public', 'GET', { r: 'comments', type: 'realisation', id: rid });
  assert.equal(r.body.total, 3); assert.equal(r.body.items[0].replies.length, 2);
  r = await call('public', 'POST', { r: 'comment' }, { type: 'site', name: 'Anne', content: 'Super site' });
  assert.equal(r.status, 200);
  r = await call('public', 'POST', { r: 'like' }, { type: 'comment', id: c1, visitor: 'visitor-0003' });
  assert.equal(r.body.likes, 1);
  r = await call('public', 'POST', { r: 'comment' }, { type: 'site', name: 'Bot', content: 'spam', website: 'http://x' });
  assert.equal(r.status, 400);
  // Modération
  T.settings[0].value.comments_moderation = true;
  r = await call('public', 'POST', { r: 'comment' }, { type: 'site', name: 'Jo', content: 'En attente' });
  assert.equal(r.body.pending, true);
  r = await call('public', 'GET', { r: 'comments', type: 'site' });
  assert.equal(r.body.total, 1);
  r = await call('admin', 'GET', { r: 'comments', status: 'pending' }, null, com);
  assert.equal(r.body.items.length, 1);

  // Contact & newsletter
  r = await call('public', 'POST', { r: 'contact' }, { name: 'Léa', email: 'lea@x.cd', message: 'Bonjour' });
  assert.equal(r.status, 200);
  r = await call('public', 'POST', { r: 'newsletter' }, { email: 'lea@x.cd' });
  r = await call('public', 'POST', { r: 'newsletter' }, { email: 'lea@x.cd' });
  assert.equal(T.subscribers.length, 1);

  // Paramètres
  r = await call('admin', 'PUT', { r: 'settings', key: 'contact' }, { value: { email: 'info@mwas.cd', phones: ['+243 1'] } }, com);
  assert.equal(r.status, 403);
  r = await call('admin', 'PUT', { r: 'settings', key: 'contact' }, { value: { email: 'info@mwas.cd', phones: ['+243 1'] } }, adminSession);
  assert.equal(r.status, 200);
  r = await call('admin', 'POST', { r: 'upload' }, { filename: 'photo.JPG', contentType: 'image/jpeg', folder: 'gallery' }, adminSession);
  assert.ok(r.body.uploadUrl.includes('token=abc'), JSON.stringify(r.body)); assert.ok(r.body.publicUrl.includes('/storage/v1/object/public/media/gallery/'));

  // Dons
  r = await call('donate', 'POST', {}, { amount: 5000, currency: 'CDF', network: 'orange', phone: '0812345678' });
  assert.equal(r.status, 400, 'mauvais réseau détecté');
  r = await call('donate', 'POST', {}, { amount: 500, currency: 'CDF', network: 'mpesa', phone: '0812345678' });
  assert.equal(r.status, 400, 'minimum');
  r = await call('donate', 'POST', {}, { amount: 5000, currency: 'CDF', network: 'mpesa', phone: '+243 812 345 678', anonymous: false, donor_name: 'Jean' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(flexCalls[0].phone, '243812345678'); assert.equal(flexCalls[0].type, '1'); assert.ok(flexCalls[0].callbackUrl.startsWith('https://mwas.test/api/donate-callback?ref='));
  const ref = r.body.donation.reference, key = r.body.key;
  r = await call('donate', 'GET', { ref, key: 'bad' });
  assert.equal(r.status, 404);
  T.donations[0].created_at = new Date(Date.now() - 20000).toISOString();
  r = await call('donate', 'GET', { ref, key });
  assert.equal(r.body.donation.status, 'success', 'vérification FlexPay');
  // Callback falsifié
  T.donations[0].status = 'pending';
  r = await call('cb', 'POST', { ref, sig: 'nope' }, { code: '0' });
  assert.equal(T.donations[0].status, 'pending');
  const sig = flexCalls[0].callbackUrl.split('sig=')[1];
  r = await call('cb', 'POST', { ref, sig }, { code: '0', reference: ref });
  assert.equal(T.donations[0].status, 'success');
  r = await call('admin', 'GET', { r: 'dashboard' }, null, adminSession);
  assert.equal(r.body.donations.total_by_currency.CDF, 5000);
  r = await call('admin', 'DELETE', { r: 'donations', id: T.donations[0].id }, null, adminSession);
  assert.equal(r.status, 405);

  // PIN : 5 erreurs => session révoquée
  r = await call('auth', 'POST', { a: 'login' }, { email: 'admin@mwas.cd', password: 'password1' });
  const t3 = r.body.ticket, s3 = r.body.session;
  for (let i = 0; i < 4; i++) { r = await call('auth', 'POST', { a: 'unlock' }, { pin: '9999' }, t3); assert.equal(r.status, 403); }
  r = await call('auth', 'POST', { a: 'unlock' }, { pin: '9999' }, t3);
  assert.equal(r.status, 401);
  r = await call('admin', 'GET', { r: 'dashboard' }, null, s3);
  assert.equal(r.status, 401, 'toutes les sessions révoquées');
  r = await call('auth', 'POST', { a: 'unlock' }, { pin: '1234' }, t3);
  assert.equal(r.status, 401, 'ancien ticket inutilisable');

  // Désactivation d'un utilisateur
  r = await call('auth', 'POST', { a: 'login' }, { email: 'admin@mwas.cd', password: 'password1' });
  const s4 = r.body.session;
  const comUser = T.users.find(u => u.email === 'com@mwas.cd');
  r = await call('admin', 'PUT', { r: 'users', id: comUser.id }, { active: false }, s4);
  assert.equal(r.status, 200);
  r = await call('admin', 'GET', { r: 'articles' }, null, com);
  assert.equal(r.status, 401);
  r = await call('admin', 'GET', { r: 'audit_log' }, null, s4);
  assert.ok(r.body.items.length > 5);

  // Campagnes : validation, clôture manuelle, conversion en réalisation, dernière activité
  r = await call('admin', 'POST', { r: 'campaigns' }, { title: 'Test campagne', start_date: '2026-11-25', end_date: '2026-11-20' }, s4);
  assert.equal(r.status, 400, 'fin avant début refusée');
  r = await call('admin', 'POST', { r: 'campaigns' }, { title: 'Test campagne', category: 'Édition 1', lead: 'Texte de lancement', start_date: '2020-01-01', themes: ['Thème A', 'Thème B'], pillars: [['Former', 'x']], poster: 'img/p.jpg' }, s4);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const cid = r.body.item.id;
  r = await call('public', 'GET', { r: 'site' });
  assert.equal(r.body.campaigns.length, 1, 'campagne sans date de fin affichée');
  r = await call('admin', 'POST', { r: 'campaign-finish', id: cid }, { report: ['x'] }, s4);
  assert.equal(r.status, 400, 'date de réalisation obligatoire');
  r = await call('admin', 'POST', { r: 'campaign-finish', id: cid }, { realised_on: '2099-01-01' }, s4);
  assert.equal(r.status, 400, 'date future refusée');
  assert.equal(T.campaigns.find(x => x.id === cid).status, 'active', 'refus sans effet');
  r = await call('admin', 'POST', { r: 'campaign-finish', id: cid }, { realised_on: '2020-01-03', report: ['Bilan : 300 personnes touchées'], photos: ['img/photo1.jpg'] }, s4);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.realisation.event_date, '2020-01-03'); assert.equal(r.body.realisation.published, true);
  assert.equal(r.body.realisation.slug, 'test-campagne');
  assert.equal(r.body.realisation.image, 'img/photo1.jpg');
  assert.equal(r.body.campaign.latest_choice, 'pending');
  r = await call('admin', 'POST', { r: 'campaign-finish', id: cid }, {}, s4);
  assert.equal(r.status, 409, 'pas de double clôture');
  r = await call('public', 'GET', { r: 'site' });
  assert.equal(r.body.campaigns.length, 0, 'campagne terminée retirée de l’accueil');
  r = await call('public', 'GET', { r: 'realisation', slug: 'test-campagne' });
  assert.equal(r.status, 200, 'réalisation publiée');
  r = await call('admin', 'GET', { r: 'dashboard' }, null, s4);
  assert.equal(r.body.counts.campaigns_decide, 1);
  r = await call('admin', 'POST', { r: 'campaign-latest', id: cid }, { choice: 'later' }, s4);
  assert.equal(r.status, 200);
  r = await call('admin', 'GET', { r: 'dashboard' }, null, s4);
  assert.equal(r.body.counts.campaigns_decide, 1, 'toujours à décider après « plus tard »');
  r = await call('admin', 'POST', { r: 'campaign-latest', id: cid }, { choice: 'yes' }, s4);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(T.settings.find(x => x.key === 'latest_activity').value.title, 'Test campagne');
  assert.equal(T.settings.find(x => x.key === 'latest_activity').value.button_link, 'realisation-details.html?realisation=test-campagne');
  r = await call('admin', 'GET', { r: 'dashboard' }, null, s4);
  assert.equal(r.body.counts.campaigns_decide, 0);
  // Clôture automatique à la date de fin
  r = await call('admin', 'POST', { r: 'campaigns' }, { title: 'Campagne échue', start_date: '2020-02-01', end_date: '2020-02-05' }, s4);
  const cid2 = r.body.item.id;
  r = await call('public', 'GET', { r: 'site' });
  assert.equal(r.body.campaigns.length, 0);
  const c2 = T.campaigns.find(x => x.id === cid2);
  assert.equal(c2.status, 'finished'); assert.equal(c2.latest_choice, 'pending'); assert.ok(T.realisations.find(x => x.slug === 'campagne-echue'));
  assert.equal(T.realisations.find(x => x.slug === 'campagne-echue').event_date, null, 'date en attente de l’admin');
  r = await call('admin', 'POST', { r: 'campaign-latest', id: cid2 }, { choice: 'no' }, s4);
  assert.equal(r.status, 400, 'date exigée avant de répondre');
  r = await call('admin', 'POST', { r: 'campaign-latest', id: cid2 }, { choice: 'no', realised_on: '2020-02-04' }, s4);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(T.realisations.find(x => x.slug === 'campagne-echue').event_date, '2020-02-04'); assert.equal(T.settings.find(x => x.key === 'latest_activity').value.title, 'Test campagne', 'dernière activité inchangée');

  // Témoignages anonymes : dépôt, code, lecture privée, réponse, publication masquée
  r = await call('public', 'POST', { r: 'testimony' }, { role: 'victime', category: 'physique', content: 'court' });
  assert.equal(r.status, 400, 'trop court');
  r = await call('public', 'POST', { r: 'testimony' }, { role: 'temoin', category: 'sexuelle', content: "J'ai vu ma voisine frappée au quartier Kanina, avenue Lumumba à Kolwezi. Appelez +243 812 345 678.", allow_publish: true });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const code = r.body.code; assert.match(code, /^MA-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  const tm = T.testimonies[T.testimonies.length - 1];
  assert.ok(!JSON.stringify(tm).includes(code), 'le code en clair n’est jamais stocké');
  r = await call('public', 'POST', { r: 'testimony' }, { role: 'victime', category: 'psychologique', content: 'Je ne veux pas que ce soit publié, merci de me lire.', allow_publish: false });
  const code2 = r.body.code; const tm2 = T.testimonies[T.testimonies.length - 1];
  r = await call('public', 'POST', { r: 'testimony-check' }, { code: code.toLowerCase().replace(/-/g, ' ') });
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.reply, null);
  r = await call('public', 'POST', { r: 'testimony-check' }, { code: 'MA-AAAA-BBBB' });
  assert.equal(r.status, 404);
  r = await call('admin', 'GET', { r: 'testimonies', state: 'new' }, null, s4);
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.total, 2); assert.ok(!('code_hash' in r.body.items[0]), 'empreinte jamais exposée');
  r = await call('admin', 'GET', { r: 'testimonies', id: tm.id }, null, s4);
  assert.equal(r.body.item.status, 'read');
  assert.ok(!/Kolwezi|Kanina|Lumumba|812/.test(r.body.suggested_public_text), r.body.suggested_public_text);
  r = await call('admin', 'PUT', { r: 'testimonies', id: tm2.id }, { published: true }, s4);
  assert.equal(r.status, 400, 'publication refusée sans consentement');
  r = await call('admin', 'PUT', { r: 'testimonies', id: tm.id }, { reply: 'Merci pour votre courage. Contactez la ligne d’écoute.', published: true }, s4);
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.item.status, 'answered'); assert.equal(r.body.item.published, true);
  r = await call('public', 'GET', { r: 'testimonies' });
  assert.equal(r.body.items.length, 1);
  assert.ok(!/Kolwezi|Kanina|Lumumba|812/.test(JSON.stringify(r.body.items)), JSON.stringify(r.body.items));
  assert.ok(r.body.items[0].reply);
  r = await call('public', 'POST', { r: 'testimony-check' }, { code });
  assert.ok(r.body.reply && r.body.published);
  // Les témoignages publiés pendant une campagne restent visibles sur sa réalisation
  tm.campaign_id = cid2;
  r = await call('public', 'GET', { r: 'realisation', slug: 'campagne-echue' });
  assert.equal(r.body.item.testimonies.length, 1, JSON.stringify(r.body.item));
  assert.ok(!/Kolwezi|Kanina|Lumumba|812/.test(JSON.stringify(r.body.item.testimonies)));
  r = await call('public', 'GET', { r: 'realisation', slug: 'test-campagne' });
  assert.equal(r.body.item.testimonies.length, 0);
  r = await call('public', 'GET', { r: 'testimonies', campaign: cid2 });
  assert.equal(r.body.items.length, 1);
  r = await call('admin', 'PUT', { r: 'testimonies', id: tm.id }, { published: false }, s4);
  r = await call('public', 'GET', { r: 'testimonies' });
  assert.equal(r.body.items.length, 0, 'retiré du site');
  r = await call('admin', 'GET', { r: 'dashboard' }, null, s4);
  assert.equal(r.body.counts.testimonies_new, 1);

  console.log('✅ Tous les tests de l’API sont passés (' + T.audit_log.length + ' entrées de journal).');
})().catch(e => { console.error('❌', e); process.exit(1); });
