/* =====================================================
   MWAS — Données dynamiques communes à toutes les pages
   (coordonnées, réseaux sociaux, partenaires, formulaires)
   ===================================================== */
(function () {
  'use strict';

  var MWAS = window.MWAS = window.MWAS || {};

  MWAS.esc = function (v) {
    return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  MWAS.src = function (u) { return !u ? '' : (/^(https?:|data:|\/)/.test(u) ? u : u); };
  MWAS.visitor = function () {
    var k = 'mwas_visitor', v = null;
    try { v = localStorage.getItem(k); } catch (e) { /* */ }
    if (!v) {
      v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
      try { localStorage.setItem(k, v); } catch (e) { /* */ }
    }
    return v;
  };
  MWAS.api = function (path, body) {
    var opts = { headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': MWAS.visitor() } };
    if (body) { opts.method = 'POST'; opts.body = JSON.stringify(Object.assign({ visitor: MWAS.visitor() }, body)); }
    return fetch('/api/' + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.error || 'Erreur ' + r.status); e.status = r.status; throw e; }
        return d;
      });
    });
  };
  MWAS.fmtDate = function (d, opts) {
    if (!d) return '';
    var dt = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00') : new Date(d);
    return dt.toLocaleDateString('fr-FR', opts || { day: 'numeric', month: 'long', year: 'numeric' });
  };
  MWAS.fmtNum = function (n) { return new Intl.NumberFormat('fr-FR').format(Number(n) || 0); };
  MWAS.ago = function (d) {
    var s = Math.max(1, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
    if (s < 60) return 'à l’instant';
    if (s < 3600) return 'il y a ' + Math.floor(s / 60) + ' min';
    if (s < 86400) return 'il y a ' + Math.floor(s / 3600) + ' h';
    if (s < 2592000) { var j = Math.floor(s / 86400); return 'il y a ' + j + (j > 1 ? ' jours' : ' jour'); }
    return 'le ' + MWAS.fmtDate(d);
  };
  MWAS.reveal = function (root) {
    var els = (root || document).querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-visible'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    els.forEach(function (e, i) { e.style.transitionDelay = (i % 4) * 0.06 + 's'; io.observe(e); });
  };

  /* Temps d'existence (s'incrémente chaque seconde) */
  MWAS.existence = function (from) {
    if (!from) return null;
    var start = new Date(from), now = new Date();
    if (isNaN(start) || start > now) return null;
    var y = now.getFullYear() - start.getFullYear(), m = now.getMonth() - start.getMonth(), d = now.getDate() - start.getDate();
    if (d < 0) { m -= 1; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (m < 0) { y -= 1; m += 12; }
    var secs = Math.floor((now - start) / 1000), rem = secs % 86400;
    return {
      y: y, m: m, d: d, months: y * 12 + m, days: Math.floor(secs / 86400), secs: secs,
      hh: String(Math.floor(rem / 3600)).padStart(2, '0'), mm: String(Math.floor((rem % 3600) / 60)).padStart(2, '0'), ss: String(rem % 60).padStart(2, '0')
    };
  };

  var sitePromise = null;
  MWAS.site = function () {
    if (!sitePromise) sitePromise = MWAS.api('public?r=site').catch(function () { return null; });
    return sitePromise;
  };

  function telHref(p) { return 'tel:' + String(p).replace(/[^\d+]/g, ''); }
  function waHref(p) { return 'https://wa.me/' + String(p).replace(/\D/g, ''); }

  function applyContact(c) {
    if (!c) return;
    var phones = Array.isArray(c.phones) ? c.phones.filter(Boolean) : [];
    var esc = MWAS.esc;

    // Réseaux sociaux du pied de page
    var socials = [
      ['whatsapp', c.whatsapp ? waHref(c.whatsapp) : '', 'WhatsApp'],
      ['facebook', c.facebook, 'Facebook'], ['instagram', c.instagram, 'Instagram'],
      ['tiktok', c.tiktok, 'TikTok'], ['linkedin', c.linkedin, 'LinkedIn'], ['youtube', c.youtube, 'YouTube']
    ].filter(function (s) { return s[1]; });
    var boxes = [];
    document.querySelectorAll('.footer-nexora .social-icon').forEach(function (a) {
      if (a.parentElement && boxes.indexOf(a.parentElement) < 0) boxes.push(a.parentElement);
    });
    boxes.forEach(function (box) {
      if (box.dataset.siteDone) return;
      box.dataset.siteDone = '1';
      if (socials.length) {
        box.innerHTML = socials.map(function (s) { return '<a href="' + esc(s[1]) + '" class="social-icon" target="_blank" rel="noopener" aria-label="' + s[2] + '"><i class="bi bi-' + s[0] + '"></i></a>'; }).join('');
      }
      if (phones.length || c.email) {
        box.insertAdjacentHTML('afterend', '<div class="footer-contact mt-3 small">' +
          phones.map(function (p) { return '<a href="' + telHref(p) + '"><i class="bi bi-telephone me-1"></i>' + esc(p) + '</a>'; }).join('') +
          (c.email ? '<a href="mailto:' + esc(c.email) + '"><i class="bi bi-envelope me-1"></i>' + esc(c.email) + '</a>' : '') +
          (c.address ? '<span><i class="bi bi-geo-alt me-1"></i>' + esc(c.address) + '</span>' : '') + '</div>');
      }
    });

    // Liaisons génériques : data-site="email|phones|address|address-full|city|hours|map"
    document.querySelectorAll('[data-site]').forEach(function (el) {
      var k = el.dataset.site;
      if (k === 'email' && c.email) { el.innerHTML = '<a href="mailto:' + esc(c.email) + '" class="text-primary-custom fw-semibold text-decoration-none">' + esc(c.email) + '</a>'; }
      if (k === 'email-text' && c.email) el.textContent = c.email;
      if (k === 'phones' && phones.length) el.innerHTML = phones.map(function (p) { return '<a href="' + telHref(p) + '" class="text-primary-custom fw-semibold text-decoration-none">' + esc(p) + '</a>'; }).join('<br>');
      if (k === 'phones-text' && phones.length) el.textContent = phones.join(' ou ');
      if (k === 'phone1' && phones[0]) { el.textContent = phones[0]; if (el.tagName === 'A') el.href = telHref(phones[0]); }
      if (k === 'address-block') el.innerHTML = [c.address, c.address_detail].filter(Boolean).map(esc).join('<br>');
      if (k === 'address' && c.address) el.textContent = c.address;
      if (k === 'address-detail') el.textContent = c.address_detail || c.address || '';
      if (k === 'city' && c.city) el.textContent = c.city;
      if (k === 'hours') { if (c.hours) { el.textContent = c.hours; el.closest('[data-site-wrap]') && (el.closest('[data-site-wrap]').hidden = false); } }
      if (k === 'map' && c.map_query) el.src = 'https://www.google.com/maps?q=' + encodeURIComponent(c.map_query) + '&output=embed';
    });
    document.querySelectorAll('a[href^="mailto:contact@"]').forEach(function (a) { if (c.email) { a.href = 'mailto:' + c.email; if (/@/.test(a.textContent)) a.textContent = c.email; } });
  }

  function applyPartners(list) {
    var box = document.querySelector('[data-partners]');
    if (!box || !Array.isArray(list) || !list.length) return;
    box.innerHTML = list.map(function (p) {
      var inner = '<div class="logo-cloud-item">' + (p.logo ? '<img src="' + MWAS.esc(p.logo) + '" alt="' + MWAS.esc(p.name) + '" loading="lazy">' : '<span class="partner-name">' + MWAS.esc(p.name) + '</span>') + '</div>';
      return '<div class="col-4 col-md-2">' + (p.url ? '<a href="' + MWAS.esc(p.url) + '" target="_blank" rel="noopener" title="' + MWAS.esc(p.name) + '">' + inner + '</a>' : inner) + '</div>';
    }).join('');
  }

  /* Formulaires : newsletter et contact (appelé par main.js après validation) */
  MWAS.submitForm = function (form) {
    var btn = form.querySelector('button[type="submit"]');
    var original = btn ? btn.innerHTML : '';
    var isContact = !!form.querySelector('textarea');
    var payload;
    if (isContact) {
      var v = function (id) { var el = form.querySelector('#' + id); return el ? el.value : ''; };
      var subject = [v('budget'), v('service')].filter(Boolean).join(' — ');
      payload = { name: v('fullName'), email: v('workEmail'), phone: v('phone'), subject: subject, message: (v('companyName') ? 'Organisation : ' + v('companyName') + '\n\n' : '') + v('message'), website: v('website') };
    } else {
      var em = form.querySelector('input[type="email"]');
      payload = { email: em ? em.value : '' };
    }
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'; }
    return MWAS.api('public?r=' + (isContact ? 'contact' : 'newsletter'), payload).then(function () {
      if (btn) btn.innerHTML = isContact ? 'Message envoyé ✓' : '<i class="bi bi-check2"></i>';
      MWAS.notice(form, isContact ? 'Merci ! Votre message a bien été envoyé. Nous vous répondrons rapidement.' : 'Merci ! Votre inscription est confirmée.', false);
      form.reset(); form.classList.remove('was-validated');
    }).catch(function (err) {
      MWAS.notice(form, err.message || 'Envoi impossible. Réessayez plus tard.', true);
      if (btn) btn.innerHTML = original;
    }).then(function () {
      setTimeout(function () { if (btn) { btn.disabled = false; btn.innerHTML = original; } }, 2500);
    });
  };
  MWAS.notice = function (form, msg, isError) {
    var n = form.querySelector('.form-notice');
    if (!n) { n = document.createElement('p'); n.className = 'form-notice small mt-2 mb-0'; n.setAttribute('role', 'status'); form.appendChild(n); }
    n.textContent = msg;
    n.classList.toggle('is-error', !!isError);
    setTimeout(function () { if (n && !isError) n.textContent = ''; }, 7000);
  };

  document.addEventListener('DOMContentLoaded', function () {
    MWAS.site().then(function (data) {
      if (!data) return;
      applyContact(data.contact);
      applyPartners(data.partners);
      document.dispatchEvent(new CustomEvent('mwas:site', { detail: data }));
    });
  });
})();
