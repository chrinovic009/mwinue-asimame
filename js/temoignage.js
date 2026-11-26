/* MWAS — Témoignages anonymes (victime ou témoin)
   - Dépôt 100 % anonyme : aucun nom, aucun e-mail, aucune adresse demandés
   - Code personnel MA-XXXX-XXXX pour lire la réponse de l'équipe en privé
   - Témoignages publiés (relus, autorisés, lieux masqués) affichés dans le bloc campagne */
(function () {
  'use strict';
  var M = window.MWAS || {};
  function esc(v) { return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function api(path, body) {
    if (M.api) return M.api(path, body);
    return fetch('/api/' + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {})
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || 'Erreur'); return d; }); });
  }
  var CATS = [
    ['physique', 'Physique', 'hand-index-thumb'], ['sexuelle', 'Sexuelle', 'shield-exclamation'], ['psychologique', 'Psychologique', 'emoji-frown'],
    ['economique', 'Économique', 'cash-coin'], ['cyber', 'Cyberharcèlement', 'phone-vibrate'], ['traditionnelle', 'Pratiques néfastes', 'exclamation-octagon'], ['autre', 'Autre', 'three-dots']
  ];
  var CAT_ICON = {}, CAT_SHORT = {}; CATS.forEach(function (c) { CAT_ICON[c[0]] = c[2]; CAT_SHORT[c[0]] = c[1]; });

  /* ---------- Bloc dans la section campagne ---------- */
  function rowHtml() {
    return '<div class="tm-row reveal">' +
      '<div class="tm-cta">' +
        '<div class="tm-cta-icon" aria-hidden="true"><i class="bi bi-shield-lock-fill"></i></div>' +
        '<h3>Victime ou témoin ?<br><span>Parlez. Nous vous écoutons.</span></h3>' +
        '<ul class="tm-trust">' +
          '<li><i class="bi bi-incognito"></i>100 % anonyme</li>' +
          '<li><i class="bi bi-geo-alt"></i>Aucun lieu publié</li>' +
          '<li><i class="bi bi-key-fill"></i>Code de suivi privé</li>' +
        '</ul>' +
        '<div class="tm-cta-btns">' +
          '<button type="button" class="cv-btn cv-btn-primary" data-tm-open="form"><i class="bi bi-pencil-square"></i> Déposer mon témoignage</button>' +
          '<button type="button" class="cv-btn cv-btn-ghost" data-tm-open="check"><i class="bi bi-key"></i> J\'ai un code</button>' +
        '</div>' +
      '</div>' +
      '<div class="tm-wall" data-tm-wall><div class="tm-wall-empty"><i class="bi bi-chat-heart"></i><p>Les témoignages relus et autorisés apparaîtront ici, sans aucun nom ni lieu.</p></div></div>' +
    '</div>';
  }
  function card(t) {
    var long = t.text.length > 220;
    return '<article class="tm-card">' +
      '<div class="tm-card-top"><span class="tm-chip"><i class="bi bi-' + (CAT_ICON[t.category] || 'chat') + '"></i>' + esc(CAT_SHORT[t.category] || t.category_label) + '</span><span class="tm-role">' + esc(t.role_label) + '</span></div>' +
      '<i class="bi bi-quote tm-quote" aria-hidden="true"></i>' +
      '<p class="tm-text' + (long ? ' is-clamped' : '') + '">' + esc(t.text) + '</p>' +
      (long ? '<button type="button" class="tm-more" data-tm-more>Lire la suite</button>' : '') +
      (t.reply ? '<div class="tm-reply"><span><i class="bi bi-heart-fill"></i> Réponse de l\'équipe</span><p>' + esc(t.reply) + '</p></div>' : '') +
    '</article>';
  }
  function fillRows() {
    var rows = document.querySelectorAll('[data-tm-row]');
    if (!rows.length) return;
    rows.forEach(function (r) { if (!r.dataset.ready) { r.innerHTML = rowHtml(); r.dataset.ready = '1'; } if (M.reveal) M.reveal(r); else r.querySelectorAll('.reveal').forEach(function (x) { x.classList.add('visible'); }); });
    api('public?r=testimonies').then(function (d) {
      var items = (d && d.items) || [];
      if (!items.length) return;
      document.querySelectorAll('[data-tm-wall]').forEach(function (w) {
        w.innerHTML = '<div class="tm-wall-head"><i class="bi bi-megaphone"></i> Elles et ils ont osé parler <small>' + items.length + '</small></div><div class="tm-track">' + items.map(card).join('') + '</div>';
      });
    }).catch(function () { /* hors ligne : on garde le message par défaut */ });
  }

  /* ---------- Fenêtre (dépôt / code) ---------- */
  var box, lastFocus;
  function modal() {
    if (box) return box;
    box = document.createElement('div');
    box.className = 'tm-modal'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'tmTitle');
    box.innerHTML = '<div class="tm-dialog"><button type="button" class="tm-close" data-tm-close aria-label="Fermer"><i class="bi bi-x-lg"></i></button><div class="tm-body" data-tm-body></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) { if (e.target === box || e.target.closest('[data-tm-close]')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('is-open')) close(); });
    return box;
  }
  function open(view) {
    lastFocus = document.activeElement;
    modal();
    if (view === 'check') showCheck(); else showForm();
    box.classList.add('is-open'); document.documentElement.style.overflow = 'hidden';
    setTimeout(function () { var f = box.querySelector('input:not([type=hidden]),textarea,button:not(.tm-close)'); if (f) f.focus(); }, 60);
  }
  function close() { box.classList.remove('is-open'); document.documentElement.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  function body() { return box.querySelector('[data-tm-body]'); }

  function showForm() {
    body().innerHTML =
      '<div class="tm-head"><span class="tm-head-icon"><i class="bi bi-shield-lock-fill"></i></span><div><h2 id="tmTitle">Déposer un témoignage</h2><p>Anonyme. Confidentiel. Lu par notre équipe.</p></div></div>' +
      '<form class="tm-form" novalidate>' +
        '<fieldset><legend>Vous êtes</legend><div class="tm-roles">' +
          '<label class="tm-role-opt"><input type="radio" name="role" value="victime" required><span><i class="bi bi-person-heart"></i><b>Victime</b><small>Cela m\'est arrivé</small></span></label>' +
          '<label class="tm-role-opt"><input type="radio" name="role" value="temoin"><span><i class="bi bi-eye"></i><b>Témoin</b><small>J\'ai vu ou entendu</small></span></label>' +
        '</div></fieldset>' +
        '<fieldset><legend>Type de violence</legend><div class="tm-cats">' + CATS.map(function (c, i) {
          return '<label class="tm-cat"><input type="radio" name="category" value="' + c[0] + '"' + (i === 6 ? ' checked' : '') + '><span><i class="bi bi-' + c[2] + '"></i>' + c[1] + '</span></label>';
        }).join('') + '</div></fieldset>' +
        '<label class="tm-label" for="tmText">Votre témoignage</label>' +
        '<div class="tm-warn"><i class="bi bi-exclamation-triangle-fill"></i>Pour votre sécurité : aucun nom, aucune adresse, aucune ville, aucun quartier.</div>' +
        '<textarea id="tmText" name="content" rows="6" maxlength="6000" required placeholder="Racontez avec vos mots…"></textarea>' +
        '<div class="tm-count"><span data-tm-count>0</span> / 6000</div>' +
        '<label class="tm-consent"><input type="checkbox" name="allow_publish"><span>J\'accepte qu\'il soit <b>publié anonymement</b> sur le site <b>après relecture</b> (sans aucun lieu).</span></label>' +
        '<input type="text" name="website" tabindex="-1" autocomplete="off" class="tm-hp" aria-hidden="true">' +
        '<ul class="tm-privacy"><li><i class="bi bi-incognito"></i>Ni nom ni e-mail</li><li><i class="bi bi-eye-slash"></i>Aucune donnée d\'identité enregistrée</li><li><i class="bi bi-key"></i>Un code pour lire notre réponse</li></ul>' +
        '<p class="tm-error" role="alert" data-tm-error></p>' +
        '<button type="submit" class="cv-btn cv-btn-primary tm-submit"><i class="bi bi-send-fill"></i> Envoyer en toute sécurité</button>' +
      '</form>' +
      '<button type="button" class="tm-link" data-tm-switch="check"><i class="bi bi-key"></i> J\'ai déjà un code</button>';
    var form = body().querySelector('form'), ta = form.querySelector('textarea'), cnt = form.querySelector('[data-tm-count]');
    ta.addEventListener('input', function () { cnt.textContent = ta.value.length; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = form.querySelector('[data-tm-error]'); err.textContent = '';
      var role = form.querySelector('input[name=role]:checked');
      if (!role) { err.textContent = 'Indiquez si vous êtes victime ou témoin.'; return; }
      if (ta.value.trim().length < 20) { err.textContent = 'Écrivez au moins quelques phrases (20 caractères minimum).'; ta.focus(); return; }
      var btn = form.querySelector('.tm-submit'); btn.disabled = true; btn.innerHTML = '<span class="tm-spin"></span> Envoi sécurisé…';
      api('public?r=testimony', {
        role: role.value, category: (form.querySelector('input[name=category]:checked') || {}).value || 'autre',
        content: ta.value.trim(), allow_publish: form.querySelector('input[name=allow_publish]').checked, website: form.querySelector('.tm-hp').value
      }).then(function (d) { showCode(d.code); })
        .catch(function (x) { err.textContent = x.message || "L'envoi a échoué. Réessayez."; btn.disabled = false; btn.innerHTML = '<i class="bi bi-send-fill"></i> Envoyer en toute sécurité'; });
    });
  }

  function showCode(code) {
    body().innerHTML =
      '<div class="tm-done"><div class="tm-done-icon"><i class="bi bi-check2"></i></div>' +
      '<h2 id="tmTitle">Merci pour votre courage</h2><p>Votre témoignage est bien arrivé, en privé, à notre équipe.</p>' +
      '<div class="tm-code-box"><small>Votre code personnel</small><strong data-code>' + esc(code) + '</strong>' +
      '<button type="button" class="tm-copy" data-tm-copy><i class="bi bi-copy"></i> Copier</button></div>' +
      '<ul class="tm-steps"><li><i class="bi bi-camera"></i>Notez-le ou faites une capture d\'écran</li><li><i class="bi bi-key"></i>Revenez avec ce code pour lire notre réponse</li><li><i class="bi bi-shield-check"></i>Personne d\'autre ne peut le retrouver</li></ul>' +
      '<button type="button" class="cv-btn cv-btn-ghost tm-dark" data-tm-close>Fermer</button></div>';
  }

  function showCheck() {
    body().innerHTML =
      '<div class="tm-head"><span class="tm-head-icon"><i class="bi bi-key-fill"></i></span><div><h2 id="tmTitle">Lire notre réponse</h2><p>Entrez votre code personnel.</p></div></div>' +
      '<form class="tm-form tm-check" novalidate><input class="tm-code-input" name="code" placeholder="MA-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="14" required>' +
      '<p class="tm-error" role="alert" data-tm-error></p>' +
      '<button type="submit" class="cv-btn cv-btn-primary tm-submit"><i class="bi bi-unlock-fill"></i> Voir ma réponse</button></form>' +
      '<div data-tm-result></div>' +
      '<button type="button" class="tm-link" data-tm-switch="form"><i class="bi bi-pencil-square"></i> Déposer un nouveau témoignage</button>';
    var form = body().querySelector('form'), inp = form.querySelector('input');
    inp.addEventListener('input', function () {
      var v = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.indexOf('MA') === 0) v = v.slice(2); v = v.slice(0, 8);
      inp.value = v ? 'MA-' + v.slice(0, 4) + (v.length > 4 ? '-' + v.slice(4) : '') : '';
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = form.querySelector('[data-tm-error]'), out = body().querySelector('[data-tm-result]'); err.textContent = ''; out.innerHTML = '';
      var btn = form.querySelector('.tm-submit'); btn.disabled = true;
      api('public?r=testimony-check', { code: inp.value }).then(function (d) {
        var date = new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        out.innerHTML = '<div class="tm-result">' +
          '<div class="tm-result-meta"><span><i class="bi bi-calendar3"></i>' + esc(date) + '</span><span><i class="bi bi-person"></i>' + esc(d.role) + '</span><span><i class="bi bi-tag"></i>' + esc(d.category) + '</span></div>' +
          '<div class="tm-status' + (d.reply ? ' is-ok' : '') + '"><i class="bi bi-' + (d.reply ? 'envelope-heart-fill' : 'hourglass-split') + '"></i>' + esc(d.status) + '</div>' +
          (d.reply ? '<div class="tm-reply tm-reply-private"><span><i class="bi bi-heart-fill"></i> Réponse de l\'équipe</span><p>' + esc(d.reply) + '</p></div>'
                   : '<p class="tm-wait">Notre équipe lit chaque témoignage avec attention. Revenez bientôt avec votre code.</p>') +
          (d.published ? '<p class="tm-pub"><i class="bi bi-globe2"></i> Votre témoignage est publié anonymement sur le site.</p>' : '') +
          '</div>';
      }).catch(function (x) { err.textContent = x.message || 'Code introuvable.'; }).then(function () { btn.disabled = false; });
    });
  }

  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-tm-open]'); if (o) { e.preventDefault(); open(o.dataset.tmOpen); return; }
    var s = e.target.closest('[data-tm-switch]'); if (s) { if (s.dataset.tmSwitch === 'check') showCheck(); else showForm(); return; }
    var c = e.target.closest('[data-tm-copy]');
    if (c) {
      var code = box.querySelector('[data-code]').textContent;
      var ok = function () { c.innerHTML = '<i class="bi bi-check2"></i> Copié'; };
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(ok).catch(function () { /* */ });
      else { var r = document.createRange(); r.selectNode(box.querySelector('[data-code]')); getSelection().removeAllRanges(); getSelection().addRange(r); }
      return;
    }
    var m = e.target.closest('[data-tm-more]');
    if (m) { var p = m.previousElementSibling; p.classList.toggle('is-clamped'); m.textContent = p.classList.contains('is-clamped') ? 'Lire la suite' : 'Réduire'; }
  });

  /* ---------- Bloc permanent : visible dès qu'aucune campagne n'est affichée ---------- */
  function syncPerma() {
    var perma = document.querySelector('[data-tm-perma]');
    if (!perma) return;
    var live = Array.prototype.some.call(document.querySelectorAll('.campaign-vbg [data-tm-row]'), function (r) { return !r.closest('[hidden]'); });
    perma.hidden = live;
  }
  document.addEventListener('mwas:site', function () { setTimeout(syncPerma, 0); });

  /* ---------- Témoignages d'une réalisation issue d'une campagne ---------- */
  function renderFor(el, items) {
    if (!el) return;
    items = items || [];
    el.hidden = false;
    el.innerHTML = '<div class="tm-real reveal visible">' +
      '<div class="tm-real-head"><span class="tm-real-icon"><i class="bi bi-chat-heart-fill"></i></span><div><h3>Elles et ils ont osé parler</h3><p>Témoignages anonymes reçus pendant la campagne · aucun nom, aucun lieu.</p></div>' +
      (items.length ? '<span class="tm-real-count">' + items.length + '</span>' : '') + '</div>' +
      (items.length ? '<div class="tm-track">' + items.map(card).join('') + '</div>'
                    : '<div class="tm-wall-empty"><i class="bi bi-chat-heart"></i><p>Aucun témoignage publié pour cette activité.</p></div>') +
      '<div class="tm-real-foot"><span><i class="bi bi-shield-lock-fill"></i> Vous aussi, vous pouvez parler en toute confidentialité.</span>' +
      '<button type="button" class="cv-btn cv-btn-primary" data-tm-open="form"><i class="bi bi-pencil-square"></i> Témoigner anonymement</button>' +
      '<button type="button" class="cv-btn cv-btn-ghost" data-tm-open="check"><i class="bi bi-key"></i> J\'ai un code</button></div>' +
    '</div>';
  }

  window.MWAS_TM = { fill: fillRows, open: open, card: card, renderFor: renderFor, syncPerma: syncPerma };
  document.addEventListener('mwas:campaigns', fillRows);
  document.addEventListener('DOMContentLoaded', fillRows);
  if (location.hash === '#temoigner') document.addEventListener('DOMContentLoaded', function () { open('form'); });
})();
