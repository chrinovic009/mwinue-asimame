(function () {
  'use strict';

  var list = document.getElementById('articles-list');
  var status = document.getElementById('articles-status');
  if (!list || !status) {
    return;
  }

  var dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long'
  });

  function addText(parent, tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function renderArticle(article) {
    var column = document.createElement('div');
    column.className = 'col-12 col-sm-6 col-md-6 col-lg-4 mb-4';

    var entry = document.createElement('div');
    entry.className = 'post-entry';
    column.appendChild(entry);

    var articleUrl = 'blog-single.html?slug=' + encodeURIComponent(article.slug);
    if (article.image_url) {
      var imageLink = document.createElement('a');
      imageLink.href = articleUrl;
      imageLink.className = 'mb-3 img-wrap';
      var image = document.createElement('img');
      image.src = article.image_url;
      image.alt = article.title;
      image.loading = 'lazy';
      image.className = 'img-fluid';
      imageLink.appendChild(image);
      entry.appendChild(imageLink);
    }

    var title = document.createElement('h3');
    var titleLink = document.createElement('a');
    titleLink.href = articleUrl;
    titleLink.textContent = article.title;
    title.appendChild(titleLink);
    entry.appendChild(title);

    var publishedAt = new Date(article.published_at);
    var dateAndCategory = dateFormatter.format(publishedAt) + ' · ' + article.category;
    addText(entry, 'span', 'date mb-4 d-block text-muted', dateAndCategory);
    addText(entry, 'p', '', article.summary);

    var readMore = document.createElement('p');
    var readMoreLink = document.createElement('a');
    readMoreLink.href = articleUrl;
    readMoreLink.className = 'link-underline';
    readMoreLink.textContent = 'Lire l’article';
    readMore.appendChild(readMoreLink);
    entry.appendChild(readMore);

    return column;
  }

  fetch('/api/articles', { headers: { Accept: 'application/json' } })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Les actualités sont momentanément indisponibles.');
      }
      return response.json();
    })
    .then(function (articles) {
      list.replaceChildren();
      if (!articles.length) {
        status.textContent = 'Aucune actualité publiée pour le moment.';
        return;
      }
      articles.forEach(function (article) {
        list.appendChild(renderArticle(article));
      });
      status.textContent = '';
    })
    .catch(function (error) {
      status.textContent = error.message;
      status.classList.add('text-danger');
    });
}());
