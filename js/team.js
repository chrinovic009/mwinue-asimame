/* MWAS — Équipe (page « Nos domaines ») */
(function () {
  'use strict';
  var M = window.MWAS, esc = M.esc;
  document.addEventListener('mwas:site', function (e) {
    var team = e.detail.team, grid = document.getElementById('teamGrid');
    if (!grid || !team || !team.length) return;
    grid.innerHTML = team.map(function (t) {
      return '<div class="col-md-6 col-lg-3 reveal"><div class="card-premium text-center">' +
        (t.photo ? '<img src="' + esc(t.photo) + '" class="rounded-circle mb-3" style="width:96px;height:96px;object-fit:cover;" alt="' + esc(t.name) + '" loading="lazy">' : '<div class="rounded-circle mb-3 mx-auto d-flex align-items-center justify-content-center fw-bold text-white" style="width:96px;height:96px;background:var(--n-gradient-primary);font-size:1.6rem">' + esc(t.name.charAt(0)) + '</div>') +
        '<h3 class="card-title">' + esc(t.name) + '</h3><p class="text-primary-custom fw-semibold mb-2">' + esc(t.role || '') + '</p><p class="small">' + esc(t.bio || '') + '</p></div></div>';
    }).join('');
    M.reveal(grid);
  });
})();
