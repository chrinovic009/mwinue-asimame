/* MWAS — Page d'accueil dynamique */
(function () {
  'use strict';
  var M = window.MWAS, esc = M.esc;
  var $ = function (s) { return document.querySelector(s); };

  function latestActivity(la) {
    var box = $('#latestActivity');
    if (!box || !la || !la.title) return;
    var img = box.querySelector('[data-la="image"]');
    if (la.image) { img.src = la.image; img.alt = la.title; }
    box.querySelector('[data-la="badge-title"]').textContent = la.badge_title || '';
    box.querySelector('[data-la="badge-date"]').textContent = la.badge_date || '';
    box.querySelector('[data-la="badge"]').hidden = !la.badge_title && !la.badge_date;
    box.querySelector('[data-la="eyebrow"]').textContent = la.eyebrow || 'Dernière activité';
    box.querySelector('[data-la="title"]').textContent = la.title;
    box.querySelector('[data-la="text"]').textContent = la.text || '';
    var ul = box.querySelector('[data-la="bullets"]');
    var bullets = Array.isArray(la.bullets) ? la.bullets : [];
    ul.innerHTML = bullets.map(function (b) {
      var t = Array.isArray(b) ? b : [b, ''];
      return '<li><i class="bi bi-check"></i><div><strong class="text-navy">' + esc(t[0]) + '</strong>' + (t[1] ? ' — ' + esc(t[1]) : '') + '</div></li>';
    }).join('');
    ul.hidden = !bullets.length;
    var btn = box.querySelector('[data-la="button"]');
    btn.textContent = la.button_label || 'Voir toutes nos activités';
    btn.href = la.button_link || 'services.html';
  }

  function stats(data) {
    var g = data.general || {};
    var team = $('#statTeam'), act = $('#statActivities'), imp = $('#statImpact');
    if (team) team.textContent = data.stats.team;
    if (act) act.textContent = data.stats.activities;
    if (imp) imp.textContent = data.impact.percent + ' %';
    var num = $('#statExistence'), live = $('#statExistenceLive'), label = $('#statExistenceLabel');
    function tick() {
      var e = M.existence(g.founded_at);
      if (!e || !num) return;
      if (e.y >= 1) { num.textContent = e.y + (e.y > 1 ? ' ans' : ' an'); label.textContent = "D'existence"; }
      else { num.textContent = e.months; label.textContent = "Mois d'existence"; }
      if (live) live.textContent = (e.y ? e.y + ' a ' : '') + e.m + ' m ' + e.d + ' j · ' + e.hh + ':' + e.mm + ':' + e.ss;
    }
    tick(); setInterval(tick, 1000);
    if (g.hero_rating && $('#heroRating')) $('#heroRating').textContent = g.hero_rating;
  }

  function impact(data) {
    var sec = $('#impactSection');
    var metrics = data.impact.metrics || [];
    if (!sec || !metrics.length) return;
    sec.hidden = false;
    $('#impactPercent').textContent = data.impact.percent + ' %';
    $('#impactBars').innerHTML = metrics.map(function (m) {
      var p = Math.min(100, (Number(m.value) / (Number(m.target) || 1)) * 100);
      return '<div class="impact-bar"><div class="impact-bar-head"><strong>' + esc(m.label) + '</strong><span>' + p.toFixed(0) + ' %</span></div>' +
        '<div class="impact-track"><div class="impact-fill" data-w="' + p + '" style="background:' + esc(m.color || '#A5481D') + '"></div></div>' +
        '<small>' + M.fmtNum(m.value) + ' / ' + M.fmtNum(m.target) + ' ' + esc(m.unit || '') + '</small></div>';
    }).join('');
    var draw = function () {
      sec.querySelectorAll('.impact-fill').forEach(function (f) { f.style.width = f.dataset.w + '%'; });
      if (window.Chart && $('#impactChart')) {
        new Chart($('#impactChart'), {
          type: 'doughnut',
          data: { labels: ['Atteint', 'Restant'], datasets: [{ data: [data.impact.percent, Math.max(0, 100 - data.impact.percent)], backgroundColor: ['#A5481D', '#FFF1D6'], borderWidth: 0 }] },
          options: { cutout: '78%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return c.label + ' : ' + c.raw + ' %'; } } } }, animation: { animateRotate: true, duration: 1400 } }
        });
      }
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { draw(); io.disconnect(); } }, { threshold: 0.25 });
      io.observe(sec);
    } else draw();
  }

  function realisations(list) {
    var box = $('#homeRealisations');
    if (!box || !list || !list.length) return;
    box.innerHTML = list.map(function (r) {
      return '<div class="col-md-6 col-lg-4 reveal"><a href="realisation-details.html?realisation=' + encodeURIComponent(r.slug) + '" class="portfolio-card d-block">' +
        '<img src="' + esc(r.image) + '" alt="' + esc(r.title) + '" loading="lazy"><div class="portfolio-overlay"><span>' + esc(r.category || 'Réalisation') + '</span><h5>' + esc(r.title) + '</h5></div></a></div>';
    }).join('');
    M.reveal(box);
  }

  function testimonials(list) {
    var box = $('#homeTestimonials');
    if (!box || !list || !list.length) return;
    box.innerHTML = list.map(function (t) {
      return '<div class="col-md-6 col-lg-4 reveal"><div class="testimonial-card"><div class="stars">' + '★'.repeat(Math.max(1, Math.min(5, t.rating || 5))) + '</div><p>' + esc(t.content) + '</p>' +
        '<div class="testimonial-author">' + (t.photo ? '<img src="' + esc(t.photo) + '" alt="' + esc(t.name) + '">' : '') + '<div><div class="name">' + esc(t.name) + '</div><div class="role">' + esc(t.role || '') + '</div></div></div></div></div>';
    }).join('');
    M.reveal(box);
  }

  document.addEventListener('mwas:site', function (e) {
    var d = e.detail;
    latestActivity(d.latest_activity);
    stats(d);
    impact(d);
    realisations(d.latest_realisations);
    testimonials(d.testimonials);
  });

  document.addEventListener('DOMContentLoaded', function () {
    var gb = $('#guestbook');
    if (gb && M.engage) M.engage({ type: 'site', commentsEl: gb, heading: "Livre d'or", subheading: 'Un mot, un encouragement, une question ? Laissez-nous un message, notre équipe vous répondra.' });
    M.api('public?r=view', { type: 'page', id: 'home' }).catch(function () { /* */ });
  });
})();
