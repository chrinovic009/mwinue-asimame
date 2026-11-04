(function () {
  'use strict';

  document.querySelectorAll('[data-article]').forEach(function (card) {
    var slug = card.getAttribute('data-article');
    if (!slug) {
      return;
    }

    var href = 'blog-single.html?article=' + encodeURIComponent(slug);
    card.querySelectorAll('a[href="blog-single.html"]').forEach(function (link) {
      link.href = href;
    });
  });
}());
