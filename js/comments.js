(function () {
  'use strict';

  var list = document.getElementById('comment-list');
  var status = document.getElementById('comment-status');
  var form = document.getElementById('comment-submission-form');

  if (!list || !status || !form) {
    return;
  }

  var messageField = document.getElementById('comment-message');
  var submitStatus = document.getElementById('comment-submit-status');
  var replyContext = document.getElementById('reply-context');
  var cancelReply = document.getElementById('cancel-reply');
  var honeypot = document.getElementById('comment-website');
  var replyTo = null;
  var articleSlug = window.currentArticleSlug;
  var commentsEndpoint = window.location.hostname.endsWith('.vercel.app')
    ? '/api/comments'
    : 'comments.php';
  var dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  function setStatus(element, message, isError) {
    element.textContent = message;
    element.classList.toggle('text-danger', Boolean(isError));
    element.classList.toggle('text-muted', !isError);
  }

  function getCommentExcerpt(message) {
    var excerpt = message.trim().replace(/\s+/g, ' ');
    var characters = Array.from(excerpt);
    if (characters.length > 140) {
      excerpt = characters.slice(0, 140).join('').trimEnd() + '…';
    }
    return excerpt;
  }

  function renderComment(comment, parentComment) {
    var item = document.createElement('li');
    item.className = 'comment';
    item.id = 'comment-' + comment.id;

    var avatar = document.createElement('div');
    avatar.className = 'vcard bio';
    var avatarIcon = document.createElement('span');
    avatarIcon.className = 'icon ion-ios-person anonymous-avatar';
    avatarIcon.setAttribute('aria-hidden', 'true');
    avatar.appendChild(avatarIcon);

    var body = document.createElement('div');
    body.className = 'comment-body';

    var author = document.createElement('h3');
    author.textContent = 'Commentaire anonyme';

    var meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = dateFormatter.format(new Date(comment.created_at));

    if (parentComment) {
      var replyReference = document.createElement('div');
      replyReference.className = 'comment-reply-reference';

      var referenceLink = document.createElement('a');
      referenceLink.href = '#comment-' + parentComment.id;
      referenceLink.textContent = parentComment.parent_id === null
        ? 'Réponse au commentaire :'
        : 'Réponse à une réponse :';

      var referenceExcerpt = document.createElement('p');
      referenceExcerpt.textContent = getCommentExcerpt(parentComment.message);

      replyReference.appendChild(referenceLink);
      replyReference.appendChild(referenceExcerpt);
      body.appendChild(replyReference);
    }

    var message = document.createElement('p');
    message.className = 'comment-message';
    message.textContent = comment.message;

    var replyLine = document.createElement('p');
    var replyLink = document.createElement('a');
    replyLink.href = '#comment-form';
    replyLink.className = 'reply';
    replyLink.textContent = 'Répondre';
    replyLink.addEventListener('click', function () {
      replyTo = Number(comment.id);
      replyContext.hidden = false;
      replyContext.textContent = (comment.parent_id === null
        ? 'Votre réponse au commentaire'
        : 'Votre réponse à une réponse') + ' du ' + meta.textContent + ' : « '
        + getCommentExcerpt(comment.message) + ' »';
      cancelReply.hidden = false;
      messageField.focus();
    });
    replyLine.appendChild(replyLink);

    body.appendChild(author);
    body.appendChild(meta);
    body.appendChild(message);
    body.appendChild(replyLine);
    item.appendChild(avatar);
    item.appendChild(body);

    return item;
  }

  function loadComments() {
    status.textContent = 'Chargement des commentaires…';

    return fetch(commentsEndpoint + '?article=' + encodeURIComponent(articleSlug), {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Impossible de charger les commentaires.');
      }
      return response.json();
    }).then(function (comments) {
      list.replaceChildren();

      if (!comments.length) {
        var empty = document.createElement('li');
        empty.className = 'text-muted';
        empty.textContent = 'Aucun commentaire pour le moment. Soyez la première personne à réagir.';
        list.appendChild(empty);
        status.textContent = '';
        return;
      }

      var commentsById = new Map();
      comments.forEach(function (comment) {
        commentsById.set(Number(comment.id), comment);
      });

      var entriesById = new Map();
      comments.forEach(function (comment) {
        var parent = comment.parent_id === null
          ? null
          : commentsById.get(Number(comment.parent_id));
        entriesById.set(Number(comment.id), {
          element: renderComment(comment, parent),
          children: null
        });
      });

      comments.forEach(function (comment) {
        var entry = entriesById.get(Number(comment.id));
        var parent = comment.parent_id === null
          ? null
          : entriesById.get(Number(comment.parent_id));
        if (parent) {
          if (!parent.children) {
            parent.children = document.createElement('ul');
            parent.children.className = 'children';
            parent.element.appendChild(parent.children);
          }
          parent.children.appendChild(entry.element);
        } else {
          list.appendChild(entry.element);
        }
      });

      status.textContent = comments.length + (comments.length > 1 ? ' commentaires' : ' commentaire');
    }).catch(function (error) {
      setStatus(status, error.message, true);
    });
  }

  cancelReply.addEventListener('click', function () {
    replyTo = null;
    replyContext.hidden = true;
    replyContext.textContent = '';
    cancelReply.hidden = true;
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    setStatus(submitStatus, '', false);

    if (!form.reportValidity()) {
      return;
    }

    var submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    setStatus(submitStatus, 'Envoi en cours…', false);

    fetch(commentsEndpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        article: articleSlug,
        message: messageField.value,
        parent_id: replyTo,
        website: honeypot.value
      })
    }).then(function (response) {
      return response.json().then(function (result) {
        if (!response.ok) {
          throw new Error(result.error || 'Le commentaire n’a pas pu être envoyé.');
        }
        return result;
      });
    }).then(function () {
      form.reset();
      replyTo = null;
      replyContext.hidden = true;
      replyContext.textContent = '';
      cancelReply.hidden = true;
      setStatus(submitStatus, 'Votre commentaire a été publié.', false);
      return loadComments();
    }).catch(function (error) {
      setStatus(submitStatus, error.message, true);
    }).then(function () {
      submitButton.disabled = false;
    });
  });

  document.addEventListener('article:ready', function (event) {
    articleSlug = event.detail.slug;
    loadComments();
  });
  document.addEventListener('article:error', function () {
    setStatus(status, 'Les commentaires ne sont pas disponibles pour cette actualité.', true);
    form.querySelector('button[type="submit"]').disabled = true;
  });
  if (articleSlug) {
    loadComments();
  } else {
    setStatus(status, 'Les commentaires ne sont pas disponibles pour cette actualité.', true);
    form.querySelector('button[type="submit"]').disabled = true;
  }
}());
