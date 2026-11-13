/* MWAS — Liste des réalisations (cartes retournables) */
(function () {
  'use strict';
  var M = window.MWAS, esc = M.esc;
  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.getElementById('realisationsGrid');
    if (!grid) return;
    M.api('public?r=realisations').then(function (r) {
      if (!r.items || !r.items.length) return;
      grid.innerHTML = r.items.map(function (x) {
        return '<div class="col-md-6 col-lg-3 reveal"><div class="activity-flip">' +
          '<button class="activity-flip-front" type="button" aria-label="Afficher les détails de ' + esc(x.title) + '" aria-expanded="false"><img src="' + esc(x.image) + '" alt="" loading="lazy"></button>' +
          '<div class="activity-flip-back" aria-hidden="true" inert><h3 class="card-title">' + esc(x.title) + '</h3>' +
          (x.event_date ? '<p class="small text-slate mb-2"><i class="bi bi-calendar-event me-1"></i>' + M.fmtDate(x.event_date) + (x.location ? ' · ' + esc(x.location) : '') + '</p>' : '') +
          '<p>' + esc(x.summary || '') + '</p>' +
          '<div class="card-stats"><span><i class="bi bi-eye"></i>' + M.fmtNum(x.views) + '</span><span><i class="bi bi-heart"></i>' + M.fmtNum(x.likes) + '</span><span><i class="bi bi-chat"></i>' + M.fmtNum(x.comments) + '</span></div>' +
          '<a href="realisation-details.html?realisation=' + encodeURIComponent(x.slug) + '" class="card-link-arrow mt-2">Lire plus <i class="bi bi-arrow-right"></i></a></div></div></div>';
      }).join('');
      grid.querySelectorAll('.activity-flip').forEach(function (c) { if (window.bindActivityFlip) window.bindActivityFlip(c); });
      M.reveal(grid);
    }).catch(function () { /* on garde le contenu statique */ });
  });
})();
