/* MWAS — Détail d'une actualité (contenu, vues, j'aime, commentaires) */
(function () {
  'use strict';
  var M = window.MWAS, esc = M.esc;
  var $ = function (id) { return document.getElementById(id); };
  var slug = new URLSearchParams(location.search).get('article');
  if (!slug) { location.replace('blog.html'); return; }

  function render(a, recent) {
    document.title = a.title + ' — Mwinue Asimame';
    $('articleDescription').content = a.excerpt || a.intro || '';
    $('articleCategory').textContent = a.category || 'Actualité';
    $('articleTitle').textContent = a.title;
    $('articleBreadcrumb').textContent = a.title;
    $('articleImage').src = a.image || 'img/galerie/formations/1.jpeg';
    $('articleImage').alt = a.alt || a.title;
    $('articleIntro').textContent = a.intro || '';
    var date = $('articleDate');
    if (a.published_at) { date.textContent = '· ' + M.fmtDate(a.published_at); date.hidden = false; }
    var by = date.parentElement.querySelector('span');
    if (by && a.author_name) by.textContent = a.author_name;

    var body = $('articleBody');
    body.innerHTML = '';
    (a.paragraphs || []).forEach(function (text, i) {
      if (i === 1 && a.paragraphs.length > 2) body.insertAdjacentHTML('beforeend', '<h3 class="mb-3">Une piste pour avancer</h3>');
      var p = document.createElement('p'); p.className = 'mb-4'; p.textContent = text; body.appendChild(p);
    });
    var take = $('articleTakeaway');
    take.textContent = a.takeaway || '';
    take.closest('.widget').hidden = !a.takeaway;
    $('articleTags').innerHTML = (a.tags || []).map(function (t) { return '<span class="badge-soft">' + esc(t) + '</span>'; }).join('');

    if (recent && recent.length) {
      var w = $('recentArticles');
      w.hidden = false;
      w.querySelector('ul').innerHTML = recent.map(function (x) {
        return '<li><a class="text-decoration-none text-navy" href="blog-detail.html?article=' + encodeURIComponent(x.slug) + '">' + esc(x.title) + '</a> <i class="bi bi-arrow-right text-primary-custom"></i></li>';
      }).join('');
    }
    M.engage({ type: 'article', id: a.id, item: a, title: a.title, statsEl: $('articleStats'), commentsEl: $('commentaires'), heading: 'Commentaires', subheading: 'Réagissez à cet article, posez une question ou partagez votre expérience.' });
  }

  document.addEventListener('DOMContentLoaded', function () {
    M.api('public?r=article&slug=' + encodeURIComponent(slug)).then(function (r) { render(r.item, r.recent); }).catch(function (err) {
      if (err.status === 404) location.replace('blog.html');
      else $('articleIntro').textContent = 'Impossible de charger cet article pour le moment. Réessayez dans quelques instants.';
    });
  });
})();
