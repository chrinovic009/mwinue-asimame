/* MWAS — Section « 16 jours d'activisme » : suivi des jours, visionneuse, partage */
(function () {
  'use strict';
  var sec = document.getElementById('campagne-vbg');
  if (!sec) return;

  // La campagne mondiale a lieu chaque année du 25 novembre au 10 décembre
  var now = new Date();
  var y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  var start = new Date(y, 10, 25), end = new Date(y, 11, 10, 23, 59, 59);
  var dayMs = 86400000;
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var dayIndex = Math.floor((today - start) / dayMs) + 1; // 1 à 16 pendant la campagne

  var status = sec.querySelector('[data-cv-status]');
  var count = sec.querySelector('[data-cv-count]');
  var days = sec.querySelector('[data-cv-days]');
  var html = '';
  for (var i = 1; i <= 16; i++) {
    var cls = dayIndex > 16 || i < dayIndex ? 'is-done' : (i === dayIndex ? 'is-today' : '');
    html += '<span class="' + cls + '" title="Jour ' + i + '"></span>';
  }
  days.innerHTML = html;

  if (now < start) {
    var left = Math.ceil((start - today) / dayMs);
    status.textContent = 'Mobilisation en cours · lancement mondial le 25 novembre';
    count.textContent = left > 1 ? 'Plus que ' + left + ' jours avant le début de la campagne mondiale' : 'La campagne mondiale commence demain';
  } else if (now <= end) {
    status.textContent = 'Campagne en cours · Jour ' + dayIndex + ' sur 16';
    count.textContent = dayIndex === 16 ? 'Dernier jour de la campagne : mobilisons-nous !' : 'Encore ' + (16 - dayIndex) + ' jour' + (16 - dayIndex > 1 ? 's' : '') + ' de mobilisation';
  } else {
    status.textContent = 'Campagne ' + y + ' terminée · le combat continue';
    count.textContent = 'Merci à toutes et à tous pour votre mobilisation';
  }

  // Visionneuse de l'affiche
  var box = document.createElement('div');
  box.className = 'cv-lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Affiche de la campagne en grand');
  box.innerHTML = '<button type="button" aria-label="Fermer"><i class="bi bi-x-lg"></i></button><img alt="Affiche : les principales formes de violences basées sur le genre — Mwinue Asimame">';
  document.body.appendChild(box);
  var opener = sec.querySelector('[data-cv-open]');
  function close() { box.classList.remove('is-open'); document.documentElement.style.overflow = ''; if (opener) opener.focus(); }
  if (opener) opener.addEventListener('click', function () {
    box.querySelector('img').src = opener.dataset.full;
    box.classList.add('is-open'); document.documentElement.style.overflow = 'hidden';
    box.querySelector('button').focus();
  });
  box.addEventListener('click', function (e) { if (e.target === box || e.target.closest('button')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('is-open')) close(); });

  // Partage
  var share = sec.querySelector('[data-cv-share]');
  if (share) share.addEventListener('click', function () {
    var url = location.origin + '/#campagne-vbg';
    var text = '16 jours d’activisme contre les violences basées sur le genre : reconnaître les principales formes de VBG. Une campagne de Mwinue Asimame.';
    if (navigator.share) { navigator.share({ title: '16 jours d’activisme — Mwinue Asimame', text: text, url: url }).catch(function () { /* */ }); }
    else window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
  });
})();
