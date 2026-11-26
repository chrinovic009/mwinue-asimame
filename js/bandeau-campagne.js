/* MWAS — Bandeau de la campagne en cours, en tête de toutes les pages
   Titre, « Jour x sur N », compte à rebours jusqu'à la fin, bouton « Témoigner ».
   Les données viennent de l'administration (public?r=site → campaigns). */
(function () {
  'use strict';
  var DAY = 86400000, timer = null;
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function today() { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lubumbashi' }); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function diff(a, b) { return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / DAY); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var isHome = !!document.getElementById('campagne-vbg') || /(^|\/)(index\.html)?$/.test(location.pathname);

  function pick(list) {
    var t = today();
    var live = list.filter(function (c) { return c.start_date <= t && (!c.end_date || c.end_date >= t); });
    if (live.length) return live[0];
    var soon = list.filter(function (c) { return c.start_date > t && diff(t, c.start_date) <= 21; });
    return soon[0] || null;
  }

  function setHeight(bar) {
    var h = bar ? bar.offsetHeight : 0;
    document.documentElement.style.setProperty('--cb-h', h + 'px');
    document.documentElement.classList.toggle('has-cb', !!bar);
  }

  function render(c) {
    var old = document.querySelector('.cb-bar'); if (old) old.remove();
    clearInterval(timer);
    if (!c) { setHeight(null); return; }
    var anchor = 'campagne-' + (c.id || 'vbg');
    var link = isHome ? '#' + anchor : 'index.html#' + anchor;
    var total = c.end_date ? diff(c.start_date, c.end_date) + 1 : 0;
    var word = c.kind === 'mobilisation' ? 'Mobilisation' : 'Campagne';
    var bar = document.createElement('div');
    bar.className = 'cb-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', word + ' en cours : ' + c.title);
    bar.innerHTML = '<div class="cb-inner">' +
      '<a class="cb-main" href="' + link + '"><span class="cb-live" aria-hidden="true"></span>' +
        '<span class="cb-ribbon" aria-hidden="true"><svg viewBox="0 0 40 56"><path d="M20 4c-6 0-10 4.5-10 10.5 0 4.6 3 9.4 6.4 14.1L6 49l7 3 7-15.6L27 52l7-3-10.4-20.4C27 23.9 30 19.1 30 14.5 30 8.5 26 4 20 4Zm0 6c2.6 0 4.3 2 4.3 4.6 0 2.4-1.7 5.6-4.3 9.3-2.6-3.7-4.3-6.9-4.3-9.3C15.7 12 17.4 10 20 10Z"/></svg></span>' +
        '<span class="cb-title">' + esc(c.title) + '</span><span class="cb-day" data-cb-day></span></a>' +
      '<div class="cb-count" data-cb-count aria-live="off"><span class="cb-label" data-cb-label>Fin dans</span>' +
        '<span class="cb-u"><b data-u="d">--</b><i>j</i></span><span class="cb-u"><b data-u="h">--</b><i>h</i></span><span class="cb-u"><b data-u="m">--</b><i>min</i></span><span class="cb-u cb-s"><b data-u="s">--</b><i>s</i></span></div>' +
      '<div class="cb-actions">' +
        (isHome ? '<button type="button" class="cb-btn" data-tm-open="form">' : '<a class="cb-btn" href="index.html#temoigner">') +
        '<i class="bi bi-shield-lock-fill"></i><span>Témoigner</span>' + (isHome ? '</button>' : '</a>') +
      '</div></div><span class="cb-progress" data-cb-bar></span>';
    document.body.insertBefore(bar, document.body.firstChild);

    var start = new Date(c.start_date + 'T00:00:00+02:00').getTime();
    var end = c.end_date ? new Date(c.end_date + 'T23:59:59+02:00').getTime() : 0;
    function tick() {
      var now = Date.now(), before = now < start, target = before ? start : end;
      if (end && now > end) { render(null); return; }
      var day = diff(c.start_date, today()) + 1;
      bar.querySelector('[data-cb-day]').textContent = before ? 'Lancement le ' + new Date(c.start_date + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' }) : 'Jour ' + day + (total ? ' / ' + total : '');
      bar.querySelector('[data-cb-label]').textContent = before ? 'Début dans' : 'Fin dans';
      var cnt = bar.querySelector('[data-cb-count]');
      cnt.hidden = !target;
      if (target) {
        var left = Math.max(0, target - now) / 1000;
        var u = { d: Math.floor(left / 86400), h: Math.floor(left % 86400 / 3600), m: Math.floor(left % 3600 / 60), s: Math.floor(left % 60) };
        Object.keys(u).forEach(function (k) { var el = bar.querySelector('[data-u="' + k + '"]'); var v = k === 'd' ? String(u[k]) : pad(u[k]); if (el.textContent !== v) { el.textContent = v; el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); } });
      }
      bar.querySelector('[data-cb-bar]').style.width = (before || !total ? 0 : Math.min(100, (now - start) / (end - start) * 100)) + '%';
    }
    tick(); timer = setInterval(tick, 1000);
    setHeight(bar);
  }

  window.addEventListener('resize', function () { setHeight(document.querySelector('.cb-bar')); });

  // Repli immédiat sur l'accueil (avant la réponse de l'API) grâce aux données de la section campagne
  document.addEventListener('DOMContentLoaded', function () {
    var m = document.getElementById('campagne-vbg');
    if (m && m.dataset.start) render(pick([{ title: m.dataset.title, start_date: m.dataset.start, end_date: m.dataset.end, kind: m.dataset.kind }]));
  });
  document.addEventListener('mwas:site', function (e) {
    var list = e.detail && e.detail.campaigns;
    if (!Array.isArray(list)) return; // API indisponible : on garde le repli
    render(pick(list));
  });
})();
