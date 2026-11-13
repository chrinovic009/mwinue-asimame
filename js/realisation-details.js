/* MWAS — Détail d'une réalisation (contenu, vues, j'aime, commentaires) */
(function () {
  'use strict';
  var M = window.MWAS, esc = M.esc;
  var $ = function (id) { return document.getElementById(id); };
  var ICONS = [['icon-box-primary', 'search'], ['icon-box-secondary', 'diagram-3'], ['icon-box-success', 'pencil-square'], ['icon-box-primary', 'layers']];
  var slug = new URLSearchParams(location.search).get('realisation') || 'octobre-rose';

  function render(item, list) {
    document.title = item.title + ' — MWAS';
    if ($('realisationDescription')) $('realisationDescription').content = item.description || item.summary || '';
    $('realisationBreadcrumb').textContent = item.title;
    var gallery = Array.isArray(item.gallery) ? item.gallery.filter(Boolean) : [];
    $('realisationImage').src = gallery[0] || item.image;
    $('realisationImage').alt = item.title;
    $('realisationCategory').textContent = item.category || '';
    $('realisationTitle').textContent = item.heading || item.title;
    var meta = [];
    if (item.event_date) meta.push('<i class="bi bi-calendar-event me-1"></i>' + M.fmtDate(item.event_date));
    if (item.location) meta.push('<i class="bi bi-geo-alt me-1"></i>' + esc(item.location));
    $('realisationMeta').innerHTML = meta.join(' &nbsp;·&nbsp; ');
    $('realisationMeta').hidden = !meta.length;

    var intro = Array.isArray(item.intro) ? item.intro : [];
    $('realisationIntro1').textContent = intro[0] || '';
    $('realisationIntro2').textContent = intro.slice(1).join('\n\n');
    $('realisationIntro2').style.whiteSpace = 'pre-line';
    $('realisationIntro1').hidden = !intro[0];
    $('realisationIntro2').hidden = intro.length < 2;

    function section(headingId, boxId, arr, heading, html) {
      var h = $(headingId), box = $(boxId);
      if (!arr || !arr.length) { h.hidden = true; box.hidden = true; return; }
      h.hidden = false; box.hidden = false;
      h.textContent = heading || h.textContent;
      box.innerHTML = arr.map(html).join('');
    }
    section('realisationFeaturesHeading', 'realisationFeatures', item.features, item.features_heading, function (f, i) {
      var ic = ICONS[i % ICONS.length];
      return '<div class="col-md-6"><div class="feature-grid-item"><div class="icon-box ' + ic[0] + '"><i class="bi bi-' + ic[1] + '"></i></div><div><strong class="text-navy d-block mb-1">' + esc(f[0]) + '</strong><span class="small">' + esc(f[1] || '') + '</span></div></div></div>';
    });
    section('realisationProcessHeading', 'realisationSteps', item.steps, item.process_heading, function (st, i) {
      return '<div class="col-md-6"><div class="process-step"><span class="process-number">' + String(i + 1).padStart(2, '0') + '</span><h4 class="card-title">' + esc(st[0]) + '</h4><p class="mb-0">' + esc(st[1] || '') + '</p></div></div>';
    });
    section('realisationFaqHeading', 'serviceDetailFaq', item.questions, item.faq_heading, function (q, i) {
      return '<div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button' + (i ? ' collapsed' : '') + '" type="button" data-bs-toggle="collapse" data-bs-target="#sdfaq' + (i + 1) + '">' + esc(q[0]) + '</button></h2>' +
        '<div id="sdfaq' + (i + 1) + '" class="accordion-collapse collapse' + (i ? '' : ' show') + '" data-bs-parent="#serviceDetailFaq"><div class="accordion-body">' + esc(q[1] || '') + '</div></div></div>';
    });

    var g = $('realisationGallery');
    if (gallery.length > 1) {
      g.hidden = false;
      g.innerHTML = '<div class="col-12"><h3 class="mb-1">En images</h3></div>' + gallery.slice(1).map(function (u) {
        return '<div class="col-6 col-md-4"><a href="' + esc(u) + '" target="_blank" rel="noopener"><img src="' + esc(u) + '" class="rounded-img w-100" style="aspect-ratio:4/3;object-fit:cover" alt="' + esc(item.title) + '" loading="lazy"></a></div>';
      }).join('');
    }

    if (list && list.length) {
      $('realisationList').innerHTML = list.map(function (x) {
        var cur = x.slug === item.slug;
        return '<li><a href="realisation-details.html?realisation=' + encodeURIComponent(x.slug) + '" class="text-decoration-none ' + (cur ? 'text-primary-custom fw-bold' : 'text-navy') + '"' + (cur ? ' aria-current="page"' : '') + '>' + esc(x.title) + '</a> <i class="bi bi-arrow-right text-primary-custom"></i></li>';
      }).join('');
    }

    M.engage({ type: 'realisation', id: item.id, item: item, title: item.title, statsEl: $('realisationStats'), commentsEl: $('commentaires'), heading: 'Commentaires', subheading: 'Partagez votre avis ou votre expérience sur cette activité.' });
  }

  document.addEventListener('DOMContentLoaded', function () {
    M.api('public?r=realisation&slug=' + encodeURIComponent(slug)).then(function (r) { render(r.item, r.list); }).catch(function (err) {
      if (err.status === 404 && slug !== 'octobre-rose') location.replace('services.html');
    });
  });
})();
