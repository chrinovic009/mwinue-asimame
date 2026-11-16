/* MWAS — Indice « carte à retourner » sur les cartes de réalisations */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touched = false;
  try { touched = sessionStorage.getItem('mwas_flip_seen') === '1'; } catch (e) { /* */ }

  function markSeen() {
    touched = true;
    try { sessionStorage.setItem('mwas_flip_seen', '1'); } catch (e) { /* */ }
  }

  function decorate(card, index, io) {
    if (card.dataset.hint) return;
    card.dataset.hint = '1';
    var front = card.querySelector('.activity-flip-front');
    var back = card.querySelector('.activity-flip-back');
    if (!front || !back) return;

    front.insertAdjacentHTML('beforeend',
      '<span class="flip-corner" aria-hidden="true"></span>' +
      '<span class="flip-cue" aria-hidden="true"><span class="flip-cue-pill">' +
      '<span class="flip-cue-icon"><i class="bi bi-arrow-repeat"></i></span>' +
      '<span class="t-touch">Touchez pour découvrir</span><span class="t-hover">Survolez pour découvrir</span>' +
      '</span></span>');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'flip-back-btn';
    btn.setAttribute('aria-label', 'Retourner la carte');
    btn.innerHTML = '<i class="bi bi-arrow-counterclockwise"></i>';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      card.classList.remove('is-flipped');
      front.setAttribute('aria-expanded', 'false');
      back.setAttribute('aria-hidden', 'true');
      back.setAttribute('inert', '');
      front.focus({ preventScroll: true });
    });
    back.appendChild(btn);

    card.addEventListener('pointerenter', markSeen, { once: true });
    front.addEventListener('click', markSeen);

    if (!reduce && !touched && io) { card.dataset.peekIndex = index; io.observe(card); }
  }

  function init(grid) {
    var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var card = en.target;
        if (touched) return;
        setTimeout(function () {
          if (touched || card.classList.contains('is-flipped') || card.matches(':hover')) return;
          card.classList.add('flip-peek');
          card.addEventListener('animationend', function () { card.classList.remove('flip-peek'); }, { once: true });
        }, 500 + (Number(card.dataset.peekIndex) % 4) * 220);
      });
    }, { threshold: 0.6 }) : null;

    function run() { grid.querySelectorAll('.activity-flip').forEach(function (c, i) { decorate(c, i, io); }); }
    run();
    // Les cartes sont rechargées depuis la base : on décore aussi les nouvelles
    new MutationObserver(run).observe(grid, { childList: true, subtree: true });

    var head = grid.previousElementSibling;
    if (head && !document.querySelector('.flip-intro')) {
      var wrap = document.createElement('div');
      wrap.className = 'flip-intro-wrap';
      wrap.innerHTML = '<div class="flip-intro"><span class="fi-card" aria-hidden="true"><span class="fi-front"><i class="bi bi-image"></i></span><span class="fi-back"><i class="bi bi-text-paragraph"></i></span></span>' +
        '<span>Chaque carte cache une histoire : <strong>retournez-la</strong> pour la découvrir.</span></div>';
      grid.parentNode.insertBefore(wrap, grid);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.getElementById('realisationsGrid');
    if (grid) init(grid);
  });
})();
