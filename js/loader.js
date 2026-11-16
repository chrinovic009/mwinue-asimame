/* =====================================================
   MWAS — Écran de chargement : le logo prend vie
   1. L'arc doré se trace   2. La femme se lève derrière l'arc, comme un soleil
   3. Ses mains s'élèvent et ondulent (Éveiller)   4. Le nom et la devise apparaissent
   À inclure dans <head> :  <link rel="stylesheet" href="css/loader.css">
                            <script src="js/loader.js"></script>
   ===================================================== */
(function () {
  'use strict';
  var html = document.documentElement;
  var LOGO = (window.MWAS_LOADER_LOGO || 'img/icone.png');
  var FULL_MIN = 5000;   // durée minimale de l'animation complète (ms)
  var SHORT_MIN = 500;   // pages suivantes dans la même visite
  var MAX_WAIT = 10000;   // sécurité : on ne bloque jamais le site plus longtemps
  var seen = false;
  try { seen = !window.MWAS_LOADER_ALWAYS && sessionStorage.getItem('mwas_intro') === '1'; } catch (e) { /* */ }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var start = Date.now();
  html.classList.add('ml-loading');

  var name = 'MWINUE ASIMAME';
  var letters = name.split('').map(function (c, i) {
    return c === ' ' ? '<span style="width:.45em"></span>' : '<span style="animation-delay:' + (2.6 + i * 0.06).toFixed(3) + 's">' + c + '</span>';
  }).join('');
  var sparks = [[78, 92, 14, 3.5], [128, 76, 10, 3.9], [428, 86, 13, 3.7], [372, 70, 9, 4.1], [205, 150, 9, 4.4], [236, 238, 8, 4.7], [250, 60, 11, 4.2]]
    .map(function (s) {
      var x = s[0], y = s[1], r = s[2];
      return '<path class="ml-spark" style="animation-delay:' + s[3] + 's" d="M' + x + ' ' + (y - r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z"/>';
    }).join('');

  var markup =
    '<div class="ml-stage">' +
      '<div class="ml-rays"></div><div class="ml-glow"></div>' +
      '<div class="ml-logo"><svg viewBox="0 0 500 500" role="img" aria-label="Mwinue Asimame">' +
        '<defs>' +
          '<linearGradient id="mlGold" x1="0" x2="1"><stop offset="0" stop-color="#E9A21C"/><stop offset=".5" stop-color="#FFD979"/><stop offset="1" stop-color="#E9A21C"/></linearGradient>' +
          '<clipPath id="mlBodyClip"><path clip-rule="evenodd" d="M0 0H500V500H0Z M58 92H140V214L134 242L130 296H58Z M356 92H446V296H362L360 242L358 214Z"/></clipPath>' +
          '<clipPath id="mlRise"><rect class="ml-reveal" x="0" y="0" width="500" height="400"/></clipPath>' +
          '<clipPath id="mlAbove"><rect x="0" y="0" width="500" height="297"/></clipPath>' +
          '<clipPath id="mlHandL"><path d="M58 92H141V214L135 242L131 300H58Z"/></clipPath>' +
          '<clipPath id="mlHandR"><path d="M355 92H446V300H361L359 242L357 214Z"/></clipPath>' +
          '</defs>' +
        '<g clip-path="url(#mlRise)"><g class="ml-body"><image href="' + LOGO + '" width="500" height="500" clip-path="url(#mlBodyClip)"/></g></g>' +
        '<g clip-path="url(#mlAbove)"><g class="ml-hand ml-hand-l"><image href="' + LOGO + '" width="500" height="500" clip-path="url(#mlHandL)"/></g>' +
        '<g class="ml-hand ml-hand-r"><image href="' + LOGO + '" width="500" height="500" clip-path="url(#mlHandR)"/></g></g>' +
        '<path class="ml-arc-draw" d="M52 296 Q250 482 448 296"/>' +
        '<path class="ml-arc-shine" d="M56 300 Q250 478 444 300"/>' +
        sparks +
      '</svg></div>' +
      '<div class="ml-name" aria-hidden="true">' + letters + '</div>' +
      '<div class="ml-tag" aria-hidden="true"><span>Former.</span><span>Éveiller.</span><span>Promouvoir.</span></div>' +
      '<div class="ml-bar" role="progressbar" aria-label="Chargement du site"><i></i></div>' +
    '</div>' +
    '<button type="button" class="ml-skip">Passer l’animation</button>';

  var el = null, done = false;
  function mount() {
    if (el || !document.body) return;
    el = document.createElement('div');
    el.id = 'mwas-loader';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    if (seen || reduce) el.className = 'ml-short';
    el.innerHTML = markup;
    document.body.insertBefore(el, document.body.firstChild);
    el.querySelector('.ml-skip').addEventListener('click', function () { finish(true); });
  }
  function finish(force) {
    if (done) return;
    var min = (seen || reduce) ? SHORT_MIN : FULL_MIN;
    var wait = force ? 0 : Math.max(0, min - (Date.now() - start));
    done = true;
    setTimeout(function () {
      try { sessionStorage.setItem('mwas_intro', '1'); } catch (e) { /* */ }
      if (!el) { html.classList.remove('ml-loading'); return; }
      if (seen || reduce) el.classList.add('ml-quick');
      el.classList.add('ml-out');
      html.classList.remove('ml-loading');
      setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 1000);
    }, wait);
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', function () { finish(); });
  setTimeout(function () { finish(true); }, MAX_WAIT);
  // Retour arrière depuis le cache du navigateur : pas d'écran de chargement
  window.addEventListener('pageshow', function (e) { if (e.persisted) finish(true); });
})();
