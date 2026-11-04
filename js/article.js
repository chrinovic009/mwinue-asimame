(function () {
  'use strict';

  var title = document.getElementById('article-title');
  var category = document.getElementById('article-category');
  var date = document.getElementById('article-date');
  var summary = document.getElementById('article-summary');
  var body = document.getElementById('article-body');
  var status = document.getElementById('article-load-status');
  var imageWrap = document.getElementById('article-image-wrap');
  var image = document.getElementById('article-image');
  var tag = document.getElementById('article-tag');
  if (!title || !category || !date || !summary || !body || !status) {
    return;
  }

  var dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

  function addBodyContent(content) {
    body.replaceChildren();
    content.split(/\n\s*\n/).forEach(function (block) {
      var text = block.trim();
      if (!text) {
        return;
      }
      if (text.indexOf('## ') === 0) {
        var heading = document.createElement('h2');
        heading.className = 'mb-3 mt-5';
        heading.textContent = text.slice(3);
        body.appendChild(heading);
        return;
      }
      var paragraph = document.createElement('p');
      paragraph.textContent = text;
      body.appendChild(paragraph);
    });
  }

  function showArticle(article, updateAddress) {
    title.textContent = article.title;
    category.textContent = article.category + ' | Mwinue Asimame';
    date.textContent = dateFormatter.format(new Date(article.published_at));
    summary.textContent = article.summary;
    addBodyContent(article.body);
    document.title = article.title + ' | Mwinue Asimame';
    if (tag) {
      tag.textContent = article.category;
    }

    var imageUrl = article.image_url || '';
    if (imageUrl && (imageUrl.startsWith('/') && !imageUrl.startsWith('//')
        || /^https:\/\//i.test(imageUrl))) {
      image.src = imageUrl;
      image.alt = article.title;
      imageWrap.hidden = false;
    } else {
      image.removeAttribute('src');
      imageWrap.hidden = true;
    }

    window.currentArticleSlug = article.slug;
    if (updateAddress) {
      var newUrl = new URL(window.location.href);
      newUrl.searchParams.set('slug', article.slug);
      window.history.replaceState(null, '', newUrl);
    }
    document.dispatchEvent(new CustomEvent('article:ready', {
      detail: { slug: article.slug }
    }));
    status.textContent = '';
  }

  function fetchArticle(slug) {
    var endpoint = '/api/articles' + (slug ? '?slug=' + encodeURIComponent(slug) : '');
    return fetch(endpoint, { headers: { Accept: 'application/json' } })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (result) {
            throw new Error(result.error || 'Cette actualité est introuvable.');
          });
        }
        return response.json();
      });
  }

  var requestedSlug = new URLSearchParams(window.location.search).get('slug');
  fetchArticle(requestedSlug)
    .then(function (result) {
      var article = Array.isArray(result) ? result[0] : result;
      if (!article) {
        throw new Error('Aucune actualité n’est publiée pour le moment.');
      }
      showArticle(article, !requestedSlug);
    })
    .catch(function (error) {
      status.textContent = error.message;
      title.textContent = 'Actualité indisponible';
      document.dispatchEvent(new CustomEvent('article:error'));
    });
}());
