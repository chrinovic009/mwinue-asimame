/* MWAS — Liste des actualités (chargée depuis la base, recherche + pagination) */
(function () {
  'use strict';
  var M = window.MWAS, esc = M.esc;
  var list = document.getElementById('blogList');
  var pagination = document.getElementById('blogPagination');
  var searchInput = document.querySelector('input[type="search"]');
  var searchButton = document.querySelector('.widget .input-group .btn');
  var pageSize = 4;
  var currentPage = Number(new URLSearchParams(window.location.search).get('page')) || 1;
  var searchTerm = '';
  var entries = [];

  function card(a) {
    var date = a.published_at ? M.fmtDate(a.published_at, { month: 'long', year: 'numeric' }) : '';
    return '<div class="col-md-6 reveal" data-blog-entry data-article="' + esc(a.slug) + '"><a href="blog-detail.html?article=' + encodeURIComponent(a.slug) + '" class="text-decoration-none">' +
      '<div class="card-premium p-0 overflow-hidden"><div class="blog-card-img"><img src="' + esc(a.image) + '" alt="' + esc(a.alt || a.title) + '" loading="lazy"></div>' +
      '<div class="blog-card-body pb-4"><span class="tag-pill">' + esc(a.category || date) + '</span><h3 class="card-title">' + esc(a.title) + '</h3>' +
      '<p class="small mb-0">' + esc(a.excerpt || '') + '</p>' +
      '<div class="meta-row"><span><i class="bi bi-person me-1"></i>' + esc(a.author_name || 'Mwinue Asimame') + '</span><span><i class="bi bi-clock me-1"></i>' + (a.read_minutes || 4) + ' min</span></div>' +
      '<div class="card-stats"><span><i class="bi bi-eye"></i>' + M.fmtNum(a.views) + '</span><span><i class="bi bi-heart"></i>' + M.fmtNum(a.likes) + '</span><span><i class="bi bi-chat"></i>' + M.fmtNum(a.comments) + '</span>' + (date ? '<span class="ms-auto">' + esc(date) + '</span>' : '') + '</div>' +
      '</div></div></a></div>';
  }

  function visible() {
    return entries.filter(function (e) { return e.textContent.toLocaleLowerCase('fr').includes(searchTerm); });
  }

  function renderPagination(pageCount) {
    pagination.replaceChildren();
    function add(label, page, o) {
      var li = document.createElement('li'), a = document.createElement('a');
      li.className = 'page-item' + (o.disabled ? ' disabled' : '');
      a.className = 'page-link rounded-3 border-0 ' + (o.active ? 'btn-primary text-white' : 'bg-soft text-navy');
      a.href = '?page=' + page; a.dataset.page = String(page); a.setAttribute('aria-label', o.label);
      if (o.active) a.setAttribute('aria-current', 'page');
      if (o.disabled) a.setAttribute('aria-disabled', 'true');
      a.innerHTML = o.icon || label;
      li.appendChild(a); pagination.appendChild(li);
    }
    add('Précédent', Math.max(1, currentPage - 1), { label: 'Page précédente', disabled: currentPage === 1, icon: '<i class="bi bi-arrow-left"></i>' });
    for (var p = 1; p <= pageCount; p++) add(String(p), p, { label: 'Page ' + p, active: p === currentPage });
    add('Suivant', Math.min(pageCount, currentPage + 1), { label: 'Page suivante', disabled: currentPage === pageCount, icon: '<i class="bi bi-arrow-right"></i>' });
  }

  function render() {
    var v = visible();
    var pageCount = Math.max(1, Math.ceil(v.length / pageSize));
    currentPage = Math.min(Math.max(currentPage, 1), pageCount);
    var first = (currentPage - 1) * pageSize;
    var show = new Set(v.slice(first, first + pageSize));
    entries.forEach(function (e) { e.hidden = !show.has(e); });
    renderPagination(pageCount);
    pagination.hidden = pageCount <= 1;
    var empty = document.getElementById('blogEmpty');
    if (!v.length) {
      if (!empty) list.insertAdjacentHTML('beforeend', '<p class="text-slate" id="blogEmpty">Aucune actualité ne correspond à votre recherche.</p>');
    } else if (empty) empty.remove();
  }

  pagination.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-page]');
    if (!link || link.getAttribute('aria-disabled') === 'true') return;
    e.preventDefault();
    currentPage = Number(link.dataset.page);
    history.replaceState(null, '', '?page=' + currentPage);
    render();
    list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  function search() { searchTerm = searchInput.value.trim().toLocaleLowerCase('fr'); currentPage = 1; render(); }
  if (searchInput) { searchInput.addEventListener('input', search); }
  if (searchButton) searchButton.addEventListener('click', search);

  function init() {
    entries = Array.from(document.querySelectorAll('[data-blog-entry]'));
    render();
  }

  M.api('public?r=articles').then(function (r) {
    if (r.items && r.items.length) {
      list.innerHTML = r.items.map(card).join('');
      M.reveal(list);
    }
    init();
  }).catch(init);
})();
