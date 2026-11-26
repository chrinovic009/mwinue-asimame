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
  function hero(c) {
    var heroEl = document.querySelector('header.hero'), visual = heroEl && heroEl.querySelector('.hero-visual');
    if (!visual || !c || !c.start_date) return;
    var img = c.hero_image || c.poster;
    if (img) {
      var cov = visual.querySelector('.hero-video-cover img'); if (cov) { cov.src = img; cov.alt = c.title; }
      var v = visual.querySelector('video'); if (v) v.setAttribute('poster', img);
    }
    heroEl.classList.add('hero--campaign');
    if (!heroEl.querySelector('.hc-float')) {
      var fl = document.createElement('div'); fl.className = 'hc-float'; fl.setAttribute('aria-hidden', 'true');
      fl.innerHTML = [1, 2, 3, 4, 5, 6].map(function (i) { return '<span style="--i:' + i + '">' + RIBBON + '</span>'; }).join('');
      heroEl.insertBefore(fl, heroEl.firstChild);
    }
    var w = visual.querySelector('.hc-widget');
    if (!w) { w = document.createElement('div'); w.className = 'hc-widget'; visual.appendChild(w); }
    var link = '#' + (c.id ? 'campagne-' + c.id : 'campagne-vbg');
    w.innerHTML = '<a class="hc-chip" href="' + link + '"><span class="hc-live"></span><span data-hc-state>En cours</span></a>' +
      '<div class="hc-card"><div class="hc-top"><span class="hc-ribbon">' + RIBBON + '</span><div class="hc-title"><strong>' + esc(c.title) + '</strong><small data-hc-day></small></div></div>' +
      '<div class="hc-label" data-hc-label>Fin dans</div>' +
      '<div class="hc-count"><div><b data-u="d">--</b><span>jours</span></div><div><b data-u="h">--</b><span>heures</span></div><div><b data-u="m">--</b><span>min</span></div><div><b data-u="s">--</b><span>sec</span></div></div>' +
      '<div class="hc-bar"><span data-hc-bar></span></div>' +
      '<div class="hc-actions"><a href="' + link + '" class="hc-btn"><i class="bi bi-eye"></i> Découvrir</a><button type="button" class="hc-btn hc-btn-alt" data-tm-open="form"><i class="bi bi-shield-lock"></i> Témoigner</button></div></div>';
    var start = new Date(c.start_date + 'T00:00:00+02:00').getTime();
    var end = c.end_date ? new Date(c.end_date + 'T23:59:59+02:00').getTime() : 0;
    var total = c.end_date ? diff(c.start_date, c.end_date) + 1 : 0;
    var word = c.kind === 'mobilisation' ? 'Mobilisation' : 'Campagne';
    function tick() {
      var now = Date.now(), target, before = now < start;
      if (before) target = start; else if (end && now <= end) target = end; else if (!end) target = 0; else { w.classList.add('is-over'); w.querySelector('[data-hc-state]').textContent = word + ' terminée'; w.querySelector('[data-hc-label]').textContent = 'Merci pour votre mobilisation'; clearInterval(heroTimer); return; }
      var day = diff(c.start_date, today()) + 1;
      w.querySelector('[data-hc-state]').textContent = before ? 'Bientôt' : word + ' en cours';
      w.querySelector('[data-hc-day]').textContent = before ? 'Lancement le ' + frDate(c.start_date, true) : 'Jour ' + day + (total ? ' sur ' + total : '');
      w.querySelector('[data-hc-label]').textContent = before ? 'Lancement dans' : (target ? 'Fin dans' : 'Mobilisation en cours');
      var left = Math.max(0, (target || now) - now) / 1000;
      var u = { d: Math.floor(left / 86400), h: Math.floor(left % 86400 / 3600), m: Math.floor(left % 3600 / 60), s: Math.floor(left % 60) };
      Object.keys(u).forEach(function (k) { var el = w.querySelector('[data-u="' + k + '"]'); var v = k === 'd' ? String(u[k]) : pad(u[k]); if (el.textContent !== v) { el.textContent = v; el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); } });
      w.querySelector('.hc-count').hidden = !target;
      var pct = before || !total ? 0 : Math.min(100, (now - start) / (end - start) * 100);
      w.querySelector('[data-hc-bar]').style.width = pct + '%';
    }
    clearInterval(heroTimer); tick(); heroTimer = setInterval(tick, 1000);
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
    hero({ title: model.dataset.title, start_date: model.dataset.start, end_date: model.dataset.end, kind: model.dataset.kind, hero_image: model.dataset.hero });
  }
  document.addEventListener('mwas:site', function (e) {
    var list = e.detail && e.detail.campaigns;
    if (!model || !Array.isArray(list)) return; // API indisponible : on garde la version statique
    if (!list.length) {
      model.hidden = true; clearInterval(heroTimer);
      var hw = document.querySelector('.hc-widget'); if (hw) hw.remove();
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
