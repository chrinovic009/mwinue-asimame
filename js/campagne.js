/* MWAS — Campagnes et mobilisations sur l'accueil (gérées depuis l'administration)
   - Affiche les campagnes à venir / en cours renvoyées par l'API (public?r=site → campaigns)
   - Sans réponse de l'API, la section statique du HTML reste affichée (repli)
   - Compte à rebours avant le lancement, « Jour x sur N » pendant, visionneuse et partage */
(function () {
  'use strict';
  var DAY = 86400000;
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function today() { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lubumbashi' }); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function diff(a, b) { return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / DAY); }
  function frDate(d, long) { return new Date(d + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: long ? 'long' : 'short', timeZone: 'UTC' }); }

  var ICONS = [
    [/physique|coup/i, 'hand-index-thumb'], [/sexuel|viol/i, 'shield-exclamation'], [/psycho|émotion|emotion|mental/i, 'emoji-frown'],
    [/économ|econom|argent|financ/i, 'cash-coin'], [/cyber|numérique|internet|harcèlement|harcelement/i, 'phone-vibrate'],
    [/tradition|mariage|mutilation/i, 'exclamation-octagon'], [/cancer|santé|sante|dépistage|depistage/i, 'heart-pulse'],
    [/éducation|education|école|ecole|formation/i, 'mortarboard'], [/enfant/i, 'balloon-heart'], [/eau|hygiène|hygiene/i, 'droplet'],
    [/droit|justice|loi/i, 'bank'], [/femme|fille/i, 'gender-female']
  ];
  function iconFor(t) { for (var i = 0; i < ICONS.length; i++) if (ICONS[i][0].test(t)) return ICONS[i][1]; return 'check2-circle'; }

  /* ---------- Construction d'une section à partir des données de l'administration ---------- */
  function render(c) {
    var word = c.kind === 'mobilisation' ? 'Mobilisation' : 'Campagne';
    var total = c.end_date ? diff(c.start_date, c.end_date) + 1 : 0;
    var themes = Array.isArray(c.themes) ? c.themes : [];
    var pillars = Array.isArray(c.pillars) ? c.pillars : [];
    var tags = Array.isArray(c.hashtags) ? c.hashtags : [];
    var poster = c.poster || '', full = c.poster_full || c.poster || '';
    var h = c.headline || c.title;
    var sticker = total && total < 100 ? '<b>' + total + '</b><small>JOURS<br>D\'ACTION</small>' : '<i class="bi bi-megaphone-fill" style="font-size:2rem"></i><small>' + esc(word.toUpperCase()) + '</small>';
    var stage = poster ? '<div class="col-lg-5 order-lg-2 reveal"><div class="cv-stage"><div class="cv-back" aria-hidden="true"></div><div class="cv-sticker" aria-hidden="true">' + sticker + '</div>' +
      '<button type="button" class="cv-poster" data-cv-open data-full="' + esc(full) + '" aria-label="Voir l\'affiche en grand"><img src="' + esc(poster) + '" alt="' + esc('Affiche : ' + c.title + ' — Mwinue Asimame') + '" loading="lazy"></button>' +
      '<span class="cv-zoom"><i class="bi bi-arrows-fullscreen"></i> Agrandir</span></div></div>' : '';
    return '<div class="cv-deco" aria-hidden="true"><div class="cv-rings"><span></span><span></span><span></span></div></div><div class="container"><div class="row align-items-center g-5">' + stage +
      '<div class="' + (poster ? 'col-lg-7 order-lg-1' : 'col-lg-10 mx-auto') + ' reveal">' +
      '<span class="cv-status"><span class="cv-ribbon"><i class="bi bi-megaphone-fill"></i></span><span class="cv-dot"></span><span data-cv-status>' + esc(c.title) + '</span></span>' +
      '<h2 id="cv-title-' + esc(c.id) + '">' + esc(h) + (c.headline_highlight ? ' <span class="cv-hl">' + esc(c.headline_highlight) + '</span>' : '') + '</h2>' +
      (c.lead ? '<p class="cv-lead">' + esc(c.lead) + '</p>' : '') +
      '<div class="cv-timeline"><div class="cv-dates"><span>' + (c.end_date ? '' : 'Lancée le ') + '<strong>' + frDate(c.start_date) + '</strong>' + (c.start_caption ? ' · ' + esc(c.start_caption) : '') + '</span>' +
      (c.end_date ? '<span><strong>' + frDate(c.end_date) + '</strong>' + (c.end_caption ? ' · ' + esc(c.end_caption) : '') + '</span>' : '') + '</div>' +
      '<div class="cv-days" data-cv-days></div><div class="cv-count" data-cv-count></div></div>' +
      (themes.length ? '<div class="cv-forms">' + themes.map(function (t) { return '<div class="cv-form"><i class="bi bi-' + iconFor(t) + '"></i>' + esc(t) + '</div>'; }).join('') + '</div>' : '') +
      (pillars.length ? '<div class="cv-pledge">' + pillars.map(function (p) { p = Array.isArray(p) ? p : [p, '']; return '<div><strong>' + esc(p[0]) + '</strong><span>' + esc(p[1] || '') + '</span></div>'; }).join('') + '</div>' : '') +
      '<div class="cv-actions">' +
      (full ? '<a href="' + esc(full) + '" download class="cv-btn cv-btn-primary"><i class="bi bi-download"></i> Télécharger l\'affiche</a>' : '') +
      '<button type="button" class="cv-btn ' + (full ? 'cv-btn-ghost' : 'cv-btn-primary') + '" data-cv-share><i class="bi bi-share-fill"></i> Partager</button>' +
      '<a href="' + esc(c.cta_link || 'contact.html') + '" class="cv-btn cv-btn-ghost"><i class="bi bi-people-fill"></i> ' + esc(c.cta_label || 'Rejoindre la mobilisation') + '</a></div>' +
      (tags.length ? '<p class="cv-tags">' + tags.map(function (t) { return '#' + esc(String(t).replace(/^#/, '')); }).join(' · ') + '</p>' : '') +
      '</div></div></div>';
  }

  /* ---------- Compte à rebours / jour en cours ---------- */
  function setup(sec) {
    var start = sec.dataset.start, end = sec.dataset.end || '', word = sec.dataset.kind === 'mobilisation' ? 'Mobilisation' : 'Campagne';
    var title = sec.dataset.title || '';
    if (!start) return;
    var t = today(), total = end ? diff(start, end) + 1 : 0, dayIndex = diff(start, t) + 1;
    var status = sec.querySelector('[data-cv-status]'), count = sec.querySelector('[data-cv-count]'), days = sec.querySelector('[data-cv-days]');
    if (days) {
      if (total && total <= 31) {
        var html = '';
        for (var i = 1; i <= total; i++) html += '<span class="' + (dayIndex > total || i < dayIndex ? 'is-done' : (i === dayIndex ? 'is-today' : '')) + '" title="Jour ' + i + '"></span>';
        days.style.gridTemplateColumns = 'repeat(' + total + ', minmax(0, 1fr))';
        days.innerHTML = html;
      } else if (total) {
        var pct = Math.max(0, Math.min(100, (dayIndex / total) * 100));
        days.style.gridTemplateColumns = '1fr'; days.innerHTML = '<span style="background:linear-gradient(90deg,#E8611A ' + pct + '%,rgba(255,255,255,.14) ' + pct + '%)"></span>';
      } else days.hidden = true;
    }
    var prefix = title ? title + ' · ' : '';
    if (t < start) {
      var left = diff(t, start);
      if (status) status.textContent = prefix + 'lancement le ' + frDate(start, true);
      if (count) count.textContent = left > 1 ? 'Plus que ' + left + ' jours avant le lancement' : 'Lancement demain : tenez-vous prêts !';
    } else if (!end || t <= end) {
      if (status) status.textContent = word + ' en cours · Jour ' + dayIndex + (total ? ' sur ' + total : '');
      if (count) count.textContent = !total ? 'Mobilisation en cours : rejoignez-nous !' : (dayIndex === total ? 'Dernier jour : mobilisons-nous !' : 'Encore ' + (total - dayIndex) + ' jour' + (total - dayIndex > 1 ? 's' : '') + ' de mobilisation');
    } else {
      if (status) status.textContent = word + ' terminée · le combat continue';
      if (count) count.textContent = 'Merci à toutes et à tous pour votre mobilisation';
    }
  }

  /* ---------- Visionneuse et partage (délégation : fonctionne pour toutes les sections) ---------- */
  var box, opener;
  function lightbox(src) {
    if (!box) {
      box = document.createElement('div');
      box.className = 'cv-lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', "Affiche en grand");
      box.innerHTML = '<button type="button" aria-label="Fermer"><i class="bi bi-x-lg"></i></button><img alt="Affiche de la campagne — Mwinue Asimame">';
      document.body.appendChild(box);
      box.addEventListener('click', function (e) { if (e.target === box || e.target.closest('button')) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('is-open')) close(); });
    }
    box.querySelector('img').src = src;
    box.classList.add('is-open'); document.documentElement.style.overflow = 'hidden';
    box.querySelector('button').focus();
  }
  function close() { box.classList.remove('is-open'); document.documentElement.style.overflow = ''; if (opener) opener.focus(); }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('.campaign-vbg [data-cv-open]');
    if (o) { opener = o; lightbox(o.dataset.full); return; }
    var s = e.target.closest('.campaign-vbg [data-cv-share]');
    if (!s) return;
    var sec = s.closest('.campaign-vbg');
    var url = location.origin + location.pathname.replace(/index\.html$/, '') + '#' + sec.id;
    var text = (sec.dataset.title || '16 jours d’activisme contre les violences basées sur le genre') + ' — une ' + (sec.dataset.kind === 'mobilisation' ? 'mobilisation' : 'campagne') + ' de Mwinue Asimame.';
    if (navigator.share) navigator.share({ title: (sec.dataset.title || 'Campagne') + ' — Mwinue Asimame', text: text, url: url }).catch(function () { /* */ });
    else window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
  });

  /* ---------- Données de l'administration ---------- */
  var model = document.querySelector('.campaign-vbg');
  if (model) setup(model); // repli statique immédiat
  document.addEventListener('mwas:site', function (e) {
    var list = e.detail && e.detail.campaigns;
    if (!model || !Array.isArray(list)) return; // API indisponible : on garde la version statique
    if (!list.length) { model.hidden = true; return; }
    var anchor = model;
    list.forEach(function (c, i) {
      var sec = i === 0 ? model : document.createElement('section');
      sec.className = 'campaign-vbg'; sec.hidden = false;
      sec.id = 'campagne-' + c.id;
      sec.setAttribute('aria-labelledby', 'cv-title-' + c.id);
      sec.dataset.start = c.start_date; sec.dataset.end = c.end_date || ''; sec.dataset.kind = c.kind || 'campagne'; sec.dataset.title = c.title;
      sec.innerHTML = render(c);
      if (i > 0) { anchor.parentNode.insertBefore(sec, anchor.nextSibling); anchor = sec; }
      setup(sec);
      if (window.MWAS && window.MWAS.reveal) window.MWAS.reveal(sec); else sec.querySelectorAll('.reveal').forEach(function (r) { r.classList.add('visible', 'is-visible', 'show'); });
    });
    var hash = location.hash.slice(1);
    if (hash && (hash === 'campagne-vbg' || /^campagne-/.test(hash))) {
      var target = document.getElementById(hash) || model;
      setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
    }
  });
})();
