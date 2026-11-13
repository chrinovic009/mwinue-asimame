/* MWAS — Détail d'une photo ajoutée depuis l'administration (portfolio-single.html?id=…) */
(function () {
  'use strict';
  var M = window.MWAS;
  var id = new URLSearchParams(location.search).get('id');
  if (!id) return;
  var LABELS = { sante: 'Santé', droits: 'Droits', formations: 'Autonomisation' };
  var $ = function (x) { return document.getElementById(x); };
  var set = function (x, t) { var el = $(x); if (el) el.textContent = t; };
  var hide = function (x) { var el = $(x); if (el) el.hidden = true; };
  function link(elId, titleId, p) {
    var a = $(elId); if (!a || !p) return;
    a.href = p.legacy_key ? 'portfolio-single.html?photo=' + encodeURIComponent(p.legacy_key) : 'portfolio-single.html?id=' + p.id;
    set(titleId, p.title);
  }
  document.addEventListener('DOMContentLoaded', function () {
    M.api('public?r=photo&id=' + encodeURIComponent(id)).then(function (r) {
      var g = r.item, cat = LABELS[g.category] || g.category;
      document.title = g.title + ' — Galerie Mwinue Asimame';
      if ($('photoDescription')) $('photoDescription').content = g.description || g.title;
      set('photoPageTitle', g.title); set('photoBreadcrumb', g.title);
      set('photoRole', g.label || 'Mwinue Asimame'); set('photoCategory', cat);
      set('photoTheme', g.theme || cat); set('photoDate', g.event_date ? M.fmtDate(g.event_date) : '—');
      var img = $('photoImage'); if (img) { img.src = g.image; img.alt = g.alt || g.title; }
      set('photoEyebrow', cat); set('photoTitle', g.title);
      set('photoIntro', g.description || 'Cette photographie témoigne d’une action portée par Mwinue Asimame.');
      ['photoRibbonsSection', 'photoSpeakersSection', 'photoPartnerLink', 'photoSecondaryImage'].forEach(hide);
      var tags = Array.isArray(g.tags) && g.tags.length ? g.tags : [cat, 'Mwinue Asimame', 'Engagement'];
      [1, 2, 3].forEach(function (i) { var t = $('photoTag' + i); if (t) { t.textContent = tags[i - 1] || ''; t.hidden = !tags[i - 1]; } });
      var facts = [g.event_date ? M.fmtDate(g.event_date) : null, g.theme, cat].filter(Boolean);
      [1, 2, 3].forEach(function (i) { var f = $('photoFact' + i); if (f) { f.firstChild.textContent = facts[i - 1] || ''; f.hidden = !facts[i - 1]; } });
      link('previousPhoto', 'previousPhotoTitle', r.previous);
      link('nextPhoto', 'nextPhotoTitle', r.next);
    }).catch(function () { /* on garde l'affichage par défaut */ });
  });
})();
