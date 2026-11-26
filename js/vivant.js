/* MWAS — Petites animations : chiffres qui défilent, apparition en cascade */
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Chiffres clés : défilement de 0 à la valeur (le compteur d'existence, déjà animé, est exclu)
  function countUp(el) {
    var txt = el.textContent, m = txt.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/);
    if (!m) return;
    var target = parseFloat(m[2].replace(',', '.')), dec = (m[2].split(/[.,]/)[1] || '').length, t0 = null, dur = 1300;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = m[1] + (target * e).toFixed(dec).replace('.', ',') + m[3];
      if (k < 1) requestAnimationFrame(step); else el.textContent = txt;
    }
    requestAnimationFrame(step);
  }
  function watch() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { io.unobserve(x.target); setTimeout(function () { countUp(x.target); }, 150); } });
    }, { threshold: 0.6 });
    document.querySelectorAll('.stat-number:not(#statExistence), [data-count]').forEach(function (el) { io.observe(el); });
  }
  document.addEventListener('DOMContentLoaded', function () { setTimeout(watch, 600); });
})();
