/* =====================================================
   MWAS — Interactions : vues, j'aime, partage, commentaires
   Usage : MWAS.engage({ type: 'realisation'|'article'|'site', id, statsEl, commentsEl, title })
   ===================================================== */
(function () {
  'use strict';
  var MWAS = window.MWAS = window.MWAS || {};
  var esc = function (v) { return MWAS.esc(v); };

  function likedSet() {
    try { return JSON.parse(localStorage.getItem('mwas_likes') || '{}'); } catch (e) { return {}; }
  }
  function setLiked(key, val) {
    var s = likedSet(); if (val) s[key] = 1; else delete s[key];
    try { localStorage.setItem('mwas_likes', JSON.stringify(s)); } catch (e) { /* */ }
  }

  function statsBar(opts, item) {
    var key = opts.type + ':' + opts.id;
    var liked = !!likedSet()[key];
    var url = location.href.split('#')[0];
    var text = (opts.title || document.title) + ' — Mwinue Asimame';
    opts.statsEl.innerHTML =
      '<div class="engage-bar">' +
      '<span class="engage-stat" title="Nombre de vues"><i class="bi bi-eye"></i> <b data-views>' + MWAS.fmtNum(item.views) + '</b> vue' + (item.views > 1 ? 's' : '') + '</span>' +
      '<button type="button" class="engage-like' + (liked ? ' is-liked' : '') + '" data-like aria-pressed="' + liked + '"><i class="bi bi-heart' + (liked ? '-fill' : '') + '"></i> <b data-likes>' + MWAS.fmtNum(item.likes) + '</b> J’aime</button>' +
      '<a class="engage-stat" href="#commentaires"><i class="bi bi-chat"></i> <b data-ccount>0</b> commentaire(s)</a>' +
      '<span class="engage-share ms-auto"><span class="small text-slate me-1">Partager</span>' +
      '<a href="https://wa.me/?text=' + encodeURIComponent(text + ' ' + url) + '" target="_blank" rel="noopener" aria-label="Partager sur WhatsApp"><i class="bi bi-whatsapp"></i></a>' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '" target="_blank" rel="noopener" aria-label="Partager sur Facebook"><i class="bi bi-facebook"></i></a>' +
      '<button type="button" data-copy aria-label="Copier le lien"><i class="bi bi-link-45deg"></i></button></span></div>';
    var likeBtn = opts.statsEl.querySelector('[data-like]');
    likeBtn.addEventListener('click', function () {
      likeBtn.disabled = true;
      MWAS.api('public?r=like', { type: opts.type, id: opts.id }).then(function (r) {
        setLiked(key, r.liked);
        likeBtn.classList.toggle('is-liked', r.liked);
        likeBtn.setAttribute('aria-pressed', String(r.liked));
        likeBtn.querySelector('i').className = 'bi bi-heart' + (r.liked ? '-fill' : '');
        likeBtn.querySelector('[data-likes]').textContent = MWAS.fmtNum(r.likes);
        if (r.liked) { likeBtn.classList.add('pop'); setTimeout(function () { likeBtn.classList.remove('pop'); }, 400); }
      }).catch(function () { /* */ }).then(function () { likeBtn.disabled = false; });
    });
    opts.statsEl.querySelector('[data-copy]').addEventListener('click', function (e) {
      var b = e.currentTarget;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () {
        b.innerHTML = '<i class="bi bi-check2"></i>'; setTimeout(function () { b.innerHTML = '<i class="bi bi-link-45deg"></i>'; }, 1500);
      }).catch(function () { prompt('Lien à copier :', url); });
    });
  }

  function commentHtml(c, isReply) {
    var key = 'comment:' + c.id, liked = !!likedSet()[key];
    return '<div class="cmt' + (c.is_staff ? ' cmt-staff' : '') + (isReply ? ' cmt-reply' : '') + '" data-cid="' + c.id + '">' +
      '<div class="cmt-avatar">' + (c.is_staff ? '<img src="img/icone.png" alt="">' : esc((c.author_name || '?').trim().charAt(0).toUpperCase())) + '</div>' +
      '<div class="cmt-body"><div class="cmt-head"><strong>' + esc(c.author_name) + '</strong>' + (c.is_staff ? '<span class="cmt-badge">Mwinue Asimame</span>' : '') + '<span class="cmt-date">' + MWAS.ago(c.created_at) + '</span></div>' +
      '<div class="cmt-text">' + esc(c.content) + '</div>' +
      '<div class="cmt-actions"><button type="button" data-clike class="' + (liked ? 'is-liked' : '') + '"><i class="bi bi-heart' + (liked ? '-fill' : '') + '"></i> <span>' + (c.likes || 0) + '</span></button>' +
      (isReply ? '' : '<button type="button" data-creply><i class="bi bi-reply"></i> Répondre</button>') + '</div>' +
      (isReply ? '' : '<div class="cmt-replies">' + (c.replies || []).map(function (r) { return commentHtml(r, true); }).join('') + '</div><div class="cmt-reply-box"></div>') +
      '</div></div>';
  }

  function formHtml(isReply) {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('mwas_author') || '{}'); } catch (e) { /* */ }
    return '<form class="cmt-form' + (isReply ? ' is-reply' : '') + '" novalidate>' +
      (isReply ? '' : '<h4 class="mb-3">Laisser un commentaire</h4>') +
      '<div class="row g-2"><div class="col-md-6"><input class="form-control" name="name" maxlength="80" placeholder="Votre nom *" required value="' + esc(saved.name || '') + '"></div>' +
      '<div class="col-md-6"><input class="form-control" type="email" name="email" maxlength="200" placeholder="E-mail (facultatif, non publié)" value="' + esc(saved.email || '') + '"></div>' +
      '<div class="col-12"><textarea class="form-control" name="content" rows="' + (isReply ? 2 : 4) + '" maxlength="3000" placeholder="' + (isReply ? 'Votre réponse…' : 'Votre commentaire…') + ' *" required></textarea></div>' +
      '<input type="text" name="website" tabindex="-1" autocomplete="off" class="hp-field" aria-hidden="true">' +
      '<div class="col-12 d-flex align-items-center gap-2"><button class="btn btn-primary btn-sm-custom" type="submit">' + (isReply ? 'Répondre' : 'Publier') + ' <i class="bi bi-send ms-1"></i></button>' +
      (isReply ? '<button class="btn btn-light-custom btn-sm-custom" type="button" data-cancel>Annuler</button>' : '') +
      '<span class="form-notice small" role="status"></span></div></div></form>';
  }

  function commentsSection(opts) {
    var el = opts.commentsEl;
    el.id = el.id || 'commentaires';
    el.innerHTML = '<div class="comments-wrap"><h3 class="mb-1">' + esc(opts.heading || 'Commentaires') + ' <span class="cmt-total">(0)</span></h3>' +
      (opts.subheading ? '<p class="text-slate mb-3">' + esc(opts.subheading) + '</p>' : '') +
      formHtml(false) + '<div class="cmt-list"><p class="text-slate small">Chargement des commentaires…</p></div></div>';
    var list = el.querySelector('.cmt-list');
    var total = 0;
    function setTotal(n) {
      total = n;
      el.querySelector('.cmt-total').textContent = '(' + n + ')';
      var cc = document.querySelector('[data-ccount]'); if (cc) cc.textContent = n;
    }
    function load() {
      MWAS.api('public?r=comments&type=' + opts.type + (opts.id ? '&id=' + opts.id : '')).then(function (r) {
        setTotal(r.total);
        list.innerHTML = r.items.length ? r.items.map(function (c) { return commentHtml(c, false); }).join('') : '<p class="text-slate small cmt-empty">Soyez la première personne à commenter.</p>';
      }).catch(function () { list.innerHTML = '<p class="text-slate small">Les commentaires sont momentanément indisponibles.</p>'; });
    }
    function submit(form, parentId) {
      var fd = new FormData(form);
      var notice = form.querySelector('.form-notice');
      var data = { type: opts.type, id: opts.id, parent_id: parentId || null, name: fd.get('name'), email: fd.get('email'), content: fd.get('content'), website: fd.get('website') };
      if (!String(data.name).trim() || !String(data.content).trim()) { notice.textContent = 'Indiquez votre nom et votre message.'; notice.classList.add('is-error'); return; }
      try { localStorage.setItem('mwas_author', JSON.stringify({ name: data.name, email: data.email })); } catch (e) { /* */ }
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
      MWAS.api('public?r=comment', data).then(function (r) {
        notice.classList.remove('is-error');
        if (r.pending) { notice.textContent = 'Merci ! Votre commentaire sera publié après validation.'; form.querySelector('textarea').value = ''; return; }
        notice.textContent = 'Merci pour votre message !';
        form.querySelector('textarea').value = '';
        var empty = list.querySelector('.cmt-empty'); if (empty) empty.remove();
        if (parentId) {
          var host = list.querySelector('[data-cid="' + parentId + '"] .cmt-replies');
          if (host) host.insertAdjacentHTML('beforeend', commentHtml(r.comment, true));
          form.remove();
        } else {
          list.insertAdjacentHTML('afterbegin', commentHtml(r.comment, false));
        }
        setTotal(total + 1);
      }).catch(function (err) { notice.textContent = err.message; notice.classList.add('is-error'); })
        .then(function () { btn.disabled = false; });
    }
    el.addEventListener('submit', function (e) {
      var form = e.target.closest('.cmt-form'); if (!form) return;
      e.preventDefault();
      var parent = form.classList.contains('is-reply') ? form.closest('[data-cid]').dataset.cid : null;
      submit(form, parent);
    });
    el.addEventListener('click', function (e) {
      var rb = e.target.closest('[data-creply]');
      if (rb) {
        var box = rb.closest('[data-cid]').querySelector('.cmt-reply-box');
        if (!box.innerHTML) { box.innerHTML = formHtml(true); box.querySelector('textarea').focus(); }
        return;
      }
      if (e.target.closest('[data-cancel]')) { e.target.closest('.cmt-reply-box').innerHTML = ''; return; }
      var lb = e.target.closest('[data-clike]');
      if (lb) {
        var id = lb.closest('[data-cid]').dataset.cid;
        lb.disabled = true;
        MWAS.api('public?r=like', { type: 'comment', id: id }).then(function (r) {
          setLiked('comment:' + id, r.liked);
          lb.classList.toggle('is-liked', r.liked);
          lb.querySelector('i').className = 'bi bi-heart' + (r.liked ? '-fill' : '');
          lb.querySelector('span').textContent = r.likes;
        }).catch(function () { /* */ }).then(function () { lb.disabled = false; });
      }
    });
    load();
  }

  MWAS.engage = function (opts) {
    if (opts.statsEl && opts.id) {
      statsBar(opts, opts.item || { views: 0, likes: 0 });
      MWAS.api('public?r=view', { type: opts.type, id: opts.id }).then(function (r) {
        var v = opts.statsEl.querySelector('[data-views]'); if (v && r.views !== undefined) v.textContent = MWAS.fmtNum(r.views);
      }).catch(function () { /* */ });
    }
    if (opts.commentsEl) commentsSection(opts);
  };
})();
