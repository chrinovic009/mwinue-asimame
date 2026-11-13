/* MWAS — Galerie (chargée depuis la base) + filtres */
(function () {
  'use strict';
  var M = window.MWAS, esc = M.esc;
  var LABELS = { sante: 'Santé', droits: 'Droits', formations: 'Autonomisation' };

  function bindFilters() {
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active', 'btn-primary'); b.classList.add('btn-light-custom'); });
        btn.classList.add('active', 'btn-primary'); btn.classList.remove('btn-light-custom');
        var f = btn.dataset.filter;
        document.querySelectorAll('#galleryGrid [data-category]').forEach(function (it) {
          it.style.display = (f === 'all' || it.dataset.category === f) ? '' : 'none';
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindFilters();
    var grid = document.getElementById('galleryGrid');
    M.api('public?r=gallery').then(function (r) {
      if (!grid || !r.items || !r.items.length) return;
      grid.innerHTML = r.items.map(function (g) {
        var href = g.legacy_key ? 'portfolio-single.html?photo=' + encodeURIComponent(g.legacy_key) : 'portfolio-single.html?id=' + g.id;
        return '<div class="col-md-6 col-lg-4 reveal" data-category="' + esc(g.category) + '"><a href="' + href + '" class="portfolio-card d-block">' +
          '<img src="' + esc(g.image) + '" alt="' + esc(g.alt || g.title) + '" loading="lazy"><div class="portfolio-overlay"><span>' + esc(g.label || ('Mwinue Asimame · ' + (LABELS[g.category] || ''))) + '</span><h5>' + esc(g.title) + '</h5></div></a></div>';
      }).join('');
      M.reveal(grid);
      var active = document.querySelector('.filter-btn.active');
      if (active && active.dataset.filter !== 'all') active.click();
    }).catch(function () { /* contenu statique conservé */ });
  });
})();
