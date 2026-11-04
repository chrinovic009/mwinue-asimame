(function () {
  'use strict';

  var loginSection = document.getElementById('admin-login');
  var publisherSection = document.getElementById('admin-publisher');
  var loginForm = document.getElementById('admin-login-form');
  var articleForm = document.getElementById('article-form');
  var logoutButton = document.getElementById('admin-logout');
  var status = document.getElementById('admin-status');
  var publishedArticle = document.getElementById('published-article');

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('text-danger', Boolean(isError));
    status.classList.toggle('text-muted', !isError);
  }

  function showPublisher(authenticated) {
    loginSection.hidden = authenticated;
    publisherSection.hidden = !authenticated;
  }

  function requestJson(url, options) {
    return fetch(url, Object.assign({
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    }, options)).then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || 'La requête a échoué.');
        }
        return data;
      });
    });
  }

  requestJson('/api/admin/session')
    .then(function (data) {
      showPublisher(data.authenticated);
    })
    .catch(function (error) {
      setStatus(error.message, true);
    });

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var submit = loginForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    setStatus('Connexion en cours…', false);

    requestJson('/api/admin/session', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loginForm.elements.username.value,
        password: loginForm.elements.password.value
      })
    }).then(function () {
      loginForm.reset();
      showPublisher(true);
      setStatus('', false);
    }).catch(function (error) {
      setStatus(error.message, true);
    }).then(function () {
      submit.disabled = false;
    });
  });

  logoutButton.addEventListener('click', function () {
    requestJson('/api/admin/session', { method: 'DELETE' })
      .then(function () {
        showPublisher(false);
        setStatus('Vous êtes déconnecté·e.', false);
      })
      .catch(function (error) {
        setStatus(error.message, true);
      });
  });

  articleForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!articleForm.reportValidity()) {
      return;
    }

    var submit = articleForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    setStatus('Publication en cours…', false);
    publishedArticle.hidden = true;

    requestJson('/api/admin/articles', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: articleForm.elements.title.value,
        summary: articleForm.elements.summary.value,
        category: articleForm.elements.category.value,
        image_url: articleForm.elements.image_url.value,
        body: articleForm.elements.body.value
      })
    }).then(function (article) {
      articleForm.reset();
      var link = document.createElement('a');
      link.href = 'blog-single.html?slug=' + encodeURIComponent(article.slug);
      link.textContent = 'Voir l’actualité publiée';
      publishedArticle.replaceChildren(link);
      publishedArticle.hidden = false;
      setStatus('L’actualité est publiée.', false);
    }).catch(function (error) {
      setStatus(error.message, true);
    }).then(function () {
      submit.disabled = false;
    });
  });
}());
