(function () {
  'use strict';

  var entries = Array.from(document.querySelectorAll('[data-blog-entry]'));
  var pagination = document.getElementById('blogPagination');
  var searchInput = document.querySelector('input[type="search"]');
  var searchButton = document.querySelector('.widget .input-group .btn');
  var pageSize = 3;
  var currentPage = Number(new URLSearchParams(window.location.search).get('page')) || 1;
  var searchTerm = '';

  function getVisibleEntries() {
    return entries.filter(function (entry) {
      return entry.textContent.toLocaleLowerCase('fr').includes(searchTerm);
    });
  }

  function renderPagination(pageCount) {
    var list = pagination;
    list.replaceChildren();

    function addPage(label, page, options) {
      var item = document.createElement('li');
      var link = document.createElement('a');
      var isActive = options.active === true;
      var isDisabled = options.disabled === true;

      item.className = 'page-item' + (isDisabled ? ' disabled' : '');
      link.className = 'page-link rounded-3 border-0 ' + (isActive ? 'btn-primary text-white' : 'bg-soft text-navy');
      link.href = '?page=' + page;
      link.dataset.page = String(page);
      link.setAttribute('aria-label', options.label);
      if (isActive) link.setAttribute('aria-current', 'page');
      if (isDisabled) link.setAttribute('aria-disabled', 'true');
      link.innerHTML = options.icon || label;
      item.appendChild(link);
      list.appendChild(item);
    }

    addPage('Précédent', Math.max(1, currentPage - 1), {
      label: 'Page précédente',
      disabled: currentPage === 1,
      icon: '<i class="bi bi-arrow-left"></i>'
    });

    for (var page = 1; page <= pageCount; page += 1) {
      addPage(String(page), page, {
        label: 'Page ' + page,
        active: page === currentPage
      });
    }

    addPage('Suivant', Math.min(pageCount, currentPage + 1), {
      label: 'Page suivante',
      disabled: currentPage === pageCount,
      icon: '<i class="bi bi-arrow-right"></i>'
    });
  }

  function render() {
    var visibleEntries = getVisibleEntries();
    var pageCount = Math.max(1, Math.ceil(visibleEntries.length / pageSize));
    currentPage = Math.min(Math.max(currentPage, 1), pageCount);
    var firstEntry = (currentPage - 1) * pageSize;
    var pageEntries = new Set(visibleEntries.slice(firstEntry, firstEntry + pageSize));

    entries.forEach(function (entry) {
      entry.hidden = !pageEntries.has(entry);
    });

    renderPagination(pageCount);
    pagination.hidden = pageCount <= 1;
  }

  pagination.addEventListener('click', function (event) {
    var link = event.target.closest('a[data-page]');
    if (!link || link.getAttribute('aria-disabled') === 'true') return;

    event.preventDefault();
    currentPage = Number(link.dataset.page);
    var url = new URL(window.location.href);
    url.searchParams.set('page', String(currentPage));
    window.history.pushState({ page: currentPage }, '', url);
    render();
    document.getElementById('blogList').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function applySearch() {
    searchTerm = searchInput.value.trim().toLocaleLowerCase('fr');
    currentPage = 1;
    render();
  }

  searchButton.addEventListener('click', applySearch);
  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      applySearch();
    }
  });

  window.addEventListener('popstate', function () {
    currentPage = Number(new URLSearchParams(window.location.search).get('page')) || 1;
    render();
  });

  render();
})();
