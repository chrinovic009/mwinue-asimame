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

  /* ---------- Hero : campagne en cours + compte à rebours ---------- */
  var RIBBON = '<svg viewBox="0 0 40 56" aria-hidden="true"><path d="M20 4c-6 0-10 4.5-10 10.5 0 4.6 3 9.4 6.4 14.1L6 49l7 3 7-15.6L27 52l7-3-10.4-20.4C27 23.9 30 19.1 30 14.5 30 8.5 26 4 20 4Zm0 6c2.6 0 4.3 2 4.3 4.6 0 2.4-1.7 5.6-4.3 9.3-2.6-3.7-4.3-6.9-4.3-9.3C15.7 12 17.4 10 20 10Z"/></svg>';
  var heroTimer = null;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var heroOrig = null;
  function shortLead(t) {
    t = String(t || '').trim(); if (!t) return '';
    var first = t.split(/(?<=[.!?])\s+/)[0];
    return first.length > 150 ? first.slice(0, 147).replace(/\s+\S*$/, '') + '…' : first;
  }
  function shortTheme(t) { return String(t).split(/\s+(?:&|et)\s+/)[0].replace(/^Pratiques traditionnelles néfastes$/i, 'Pratiques néfastes'); }
  // Pendant la campagne, le hero parle d'elle : titre, accroche, thèmes, boutons Témoigner / Découvrir
  function heroText(c) {
    var box = document.querySelector('header.hero .hero-content');
    if (!box) return;
    if (heroOrig === null) heroOrig = box.innerHTML;
    var link = '#' + (c.id ? 'campagne-' + c.id : 'campagne-vbg');
    var word = c.kind === 'mobilisation' ? 'Mobilisation' : 'Campagne';
    var themes = (Array.isArray(c.themes) ? c.themes : []).slice(0, 4);
    box.classList.add('hc-content');
    box.innerHTML =
      '<span class="eyebrow hc-eyebrow"><span class="hc-dot" aria-hidden="true"></span>' + word + ' en cours · ' + esc(c.category || c.title) + '</span>' +
      '<h1 class="mb-3">' + esc(c.headline || c.title) + (c.headline_highlight ? ' <span class="text-primary-custom">' + esc(c.headline_highlight) + '</span>' : '') + '</h1>' +
      (c.lead ? '<p class="fs-5 mb-4 hero-lead" style="max-width:560px">' + esc(shortLead(c.lead)) + '</p>' : '') +
      (themes.length ? '<ul class="hero-pills" aria-label="Thèmes de la campagne">' + themes.map(function (t) { return '<li><i class="bi bi-' + iconFor(t) + '"></i>' + esc(shortTheme(t)) + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="d-flex flex-wrap gap-3 mb-4 justify-content-lg-start justify-content-center">' +
        '<button type="button" class="btn btn-primary btn-lg-custom" data-tm-open="form"><i class="bi bi-shield-lock-fill"></i> Témoigner anonymement</button>' +
        '<a href="' + link + '" class="btn btn-light-custom btn-lg-custom"><i class="bi bi-megaphone-fill text-primary-custom"></i> Découvrir la campagne</a>' +
      '</div>' +
      '<p class="hc-sign"><img src="img/icone.png" alt="" width="34" height="34"> Une ' + word.toLowerCase() + ' portée par <strong>Mwinue Asimame</strong></p>';
  }
  function heroReset() {
    var box = document.querySelector('header.hero .hero-content');
    if (box && heroOrig !== null) { box.innerHTML = heroOrig; box.classList.remove('hc-content'); heroOrig = null; }
  }
  function hero(c) {
    var heroEl = document.querySelector('header.hero'), visual = heroEl && heroEl.querySelector('.hero-visual');
    if (!heroEl || !c || !c.start_date) return;
    var t = today();
    if (c.end_date && c.end_date < t) return;
    var img = c.hero_image || c.poster;
    if (visual && img) {
      var cov = visual.querySelector('.hero-video-cover img'); if (cov) { cov.src = img; cov.alt = c.title; }
      var v = visual.querySelector('video'); if (v) v.setAttribute('poster', img);
    }
    heroEl.classList.add('hero--campaign');
    if (!heroEl.querySelector('.hc-float')) {
      var fl = document.createElement('div'); fl.className = 'hc-float'; fl.setAttribute('aria-hidden', 'true');
      fl.innerHTML = [1, 2, 3, 4, 5, 6].map(function (i) { return '<span style="--i:' + i + '">' + RIBBON + '</span>'; }).join('');
      heroEl.insertBefore(fl, heroEl.firstChild);
    }
    if (visual) {
      var chip = visual.querySelector('.hc-chip');
      if (!chip) { chip = document.createElement('a'); chip.className = 'hc-chip hc-chip-img'; visual.querySelector('.hero-video-card').appendChild(chip); }
      chip.href = '#' + (c.id ? 'campagne-' + c.id : 'campagne-vbg');
      var live = c.start_date <= t;
      chip.innerHTML = '<span class="hc-live"></span>' + (live ? 'En direct · Jour ' + (diff(c.start_date, t) + 1) + (c.end_date ? ' / ' + (diff(c.start_date, c.end_date) + 1) : '') : 'Bientôt');
    }
    heroText(c);
  }
  function pickHero(list) {
    var t = today();
    var live = list.filter(function (c) { return c.start_date <= t && (!c.end_date || c.end_date >= t); });
    return live[0] || list[0];
  }
  function announce() { document.dispatchEvent(new CustomEvent('mwas:campaigns')); }

  /* ---------- Données de l'administration ---------- */
  var model = document.querySelector('.campaign-vbg');
  if (model) {
    setup(model); // repli statique immédiat
    var h2 = model.querySelector('h2'), hl = h2 && h2.querySelector('.cv-hl');
    hero({
      title: model.dataset.title, start_date: model.dataset.start, end_date: model.dataset.end, kind: model.dataset.kind, hero_image: model.dataset.hero,
      headline: h2 ? h2.textContent.replace(hl ? hl.textContent : '', '').trim() : '', headline_highlight: hl ? hl.textContent.trim() : '',
      lead: (model.querySelector('.cv-lead') || {}).textContent || '',
      themes: Array.prototype.map.call(model.querySelectorAll('.cv-form'), function (f) { return f.textContent.trim(); })
    });
  }
  document.addEventListener('mwas:site', function (e) {
    var list = e.detail && e.detail.campaigns;
    if (!model || !Array.isArray(list)) return; // API indisponible : on garde la version statique
    if (!list.length) {
      model.hidden = true; heroReset();
      var hw = document.querySelector('.hc-chip-img'); if (hw) hw.remove();
      var hf = document.querySelector('.hc-float'); if (hf) hf.remove();
      var he = document.querySelector('header.hero'); if (he) he.classList.remove('hero--campaign');
      return;
    }
    var anchor = model;
    list.forEach(function (c, i) {
      var sec = i === 0 ? model : document.createElement('section');
      sec.className = 'campaign-vbg'; sec.hidden = false;
      sec.id = 'campagne-' + c.id;
      sec.setAttribute('aria-labelledby', 'cv-title-' + c.id);
      sec.dataset.start = c.start_date; sec.dataset.end = c.end_date || ''; sec.dataset.kind = c.kind || 'campagne'; sec.dataset.title = c.title;
      sec.innerHTML = render(c);
      if (i === 0) sec.querySelector('.container').insertAdjacentHTML('beforeend', '<div class="cv-voice" data-tm-row></div>');
      if (i > 0) { anchor.parentNode.insertBefore(sec, anchor.nextSibling); anchor = sec; }
      setup(sec);
      if (window.MWAS && window.MWAS.reveal) window.MWAS.reveal(sec); else sec.querySelectorAll('.reveal').forEach(function (r) { r.classList.add('visible', 'is-visible', 'show'); });
    });
    hero(pickHero(list));
    announce();
    var hash = location.hash.slice(1);
    if (hash && (hash === 'campagne-vbg' || /^campagne-/.test(hash))) {
      var target = document.getElementById(hash) || model;
      setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
    }
  });
})();
