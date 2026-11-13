/* =====================================================
   MWAS — Interface d'administration (JavaScript natif)
   ===================================================== */
(function () {
  'use strict';

  /* ---------------- Utilitaires ---------------- */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = v => String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const src = u => !u ? '' : (/^(https?:|data:|blob:|\/)/.test(u) ? u : '/' + u);
  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtDateTime = d => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtNum = n => new Intl.NumberFormat('fr-FR').format(Number(n) || 0);
  const money = (n, c) => fmtNum(n) + (c === 'USD' ? ' $' : ' FC');
  const initials = n => String(n || 'MA').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const NETWORKS = { orange: 'Orange Money', mpesa: 'M-Pesa', airtel: 'Airtel Money' };

  const K = { session: 'mwas_session', ticket: 'mwas_ticket', user: 'mwas_user', pinLen: 'mwas_pin_len' };
  const store = {
    get session() { try { return sessionStorage.getItem(K.session); } catch (e) { return null; } },
    set session(v) { try { v ? sessionStorage.setItem(K.session, v) : sessionStorage.removeItem(K.session); } catch (e) { /* */ } },
    get ticket() { try { return localStorage.getItem(K.ticket); } catch (e) { return null; } },
    set ticket(v) { try { v ? localStorage.setItem(K.ticket, v) : localStorage.removeItem(K.ticket); } catch (e) { /* */ } },
    get user() { try { return JSON.parse(localStorage.getItem(K.user) || 'null'); } catch (e) { return null; } },
    set user(v) { try { v ? localStorage.setItem(K.user, JSON.stringify({ name: v.name, email: v.email })) : localStorage.removeItem(K.user); } catch (e) { /* */ } },
    get pinLen() { try { return Number(localStorage.getItem(K.pinLen)) || 0; } catch (e) { return 0; } },
    set pinLen(v) { try { v ? localStorage.setItem(K.pinLen, String(v)) : localStorage.removeItem(K.pinLen); } catch (e) { /* */ } }
  };

  const S = { user: null, perms: {}, autoLock: 5, dashboard: null, charts: [], foundedAt: null, locked: false };

  function toast(msg, type) {
    const el = document.createElement('div');
    el.className = 'toast align-items-center text-bg-' + (type === 'error' ? 'danger' : type === 'warn' ? 'warning' : 'dark') + ' border-0';
    el.setAttribute('role', 'status');
    el.innerHTML = '<div class="d-flex"><div class="toast-body">' + esc(msg) + '</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button></div>';
    $('#toasts').appendChild(el);
    const t = new bootstrap.Toast(el, { delay: type === 'error' ? 6000 : 3000 });
    t.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
  }

  async function api(path, opts) {
    opts = opts || {};
    const headers = { 'Content-Type': 'application/json' };
    const token = opts.auth === 'ticket' ? store.ticket : opts.auth === 'none' ? null : store.session;
    if (token) headers.Authorization = 'Bearer ' + token;
    let res;
    try {
      res = await fetch('/api/' + path, { method: opts.method || (opts.body ? 'POST' : 'GET'), headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
    } catch (e) {
      throw new Error('Connexion impossible. Vérifiez votre réseau.');
    }
    let data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    if (!res.ok) {
      const err = new Error(data.error || ('Erreur ' + res.status));
      err.status = res.status;
      if (res.status === 401 && (!opts.auth || opts.auth === 'session') && !opts.noLock) lock(true);
      throw err;
    }
    return data;
  }

  function show(id) {
    ['screenBoot', 'screenFirstSetup', 'screenLogin', 'screenPinSetup', 'screenLock', 'screenApp'].forEach(s => { $('#' + s).hidden = s !== id; });
  }
  function formError(form, msg) { const el = $('[data-error]', form); if (el) el.textContent = msg || ''; }
  function busy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>' + (label || 'Patientez…'); }
    else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
  }
  const can = p => S.user && (S.user.role === 'admin' || (S.user.permissions || []).includes(p));

  /* ---------------- Démarrage ---------------- */
  async function boot() {
    $$('[data-toggle-password]').forEach(b => b.addEventListener('click', () => {
      const i = b.parentElement.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password';
      b.innerHTML = i.type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
    }));
    if (store.session) {
      try { await loadMe(); return afterAuth(); } catch (e) { if (e.status !== 401) { show('screenLogin'); formError($('#loginForm'), e.message); return; } }
    }
    if (store.ticket) return lock(false);
    show('screenLogin');
  }

  // Après authentification : première connexion → identifiants obligatoires ; sans PIN → choix du PIN
  function afterAuth() {
    if (S.user.must_change_credentials) {
      store.ticket = null;
      const f = $('#firstSetupForm'); f.reset(); formError(f, '');
      return show('screenFirstSetup');
    }
    if (!S.user.has_pin) return show('screenPinSetup');
    enterApp();
  }

  async function loadMe() {
    const me = await api('auth?a=me', { noLock: true });
    S.user = me.user; S.perms = me.permissions; S.autoLock = me.auto_lock_minutes || 5;
    store.user = me.user;
    return me;
  }

  $('#firstSetupForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, btn = $('button[type=submit]', f);
    const d = Object.fromEntries(new FormData(f));
    formError(f, '');
    if (d.password !== d.password2) return formError(f, 'Les deux mots de passe ne correspondent pas.');
    if (!/^\d{4,6}$/.test(d.pin)) return formError(f, 'Le code PIN doit contenir 4 à 6 chiffres.');
    if (d.pin !== d.pin2) return formError(f, 'Les deux codes PIN ne correspondent pas.');
    busy(btn, true);
    try {
      const r = await api('auth?a=first-setup', { body: { name: d.name, email: d.email, password: d.password, password2: d.password2, pin: d.pin } });
      store.session = r.session; store.ticket = r.ticket; store.user = r.user; store.pinLen = d.pin.length;
      f.reset();
      await loadMe(); enterApp(); toast('Compte sécurisé. Bienvenue ' + S.user.name + ' !');
    } catch (err) { formError(f, err.message); } finally { busy(btn, false); }
  });

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, btn = $('button[type=submit]', f);
    formError(f, ''); busy(btn, true, 'Connexion…');
    try {
      const r = await api('auth?a=login', { auth: 'none', body: Object.fromEntries(new FormData(f)) });
      store.session = r.session; store.ticket = r.user.must_change_credentials ? null : r.ticket; store.user = r.user;
      f.reset();
      await loadMe();
      afterAuth();
    } catch (err) { formError(f, err.message); } finally { busy(btn, false); }
  });

  $('#pinSetupForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, btn = $('button[type=submit]', f);
    const d = Object.fromEntries(new FormData(f));
    if (!/^\d{4,6}$/.test(d.pin)) return formError(f, 'Le code PIN doit contenir 4 à 6 chiffres.');
    if (d.pin !== d.pin2) return formError(f, 'Les deux codes ne correspondent pas.');
    busy(btn, true);
    try {
      await api('auth?a=set-pin', { body: { pin: d.pin } });
      store.pinLen = d.pin.length; f.reset();
      await loadMe(); enterApp(); toast('Code PIN enregistré.');
    } catch (err) { formError(f, err.message); } finally { busy(btn, false); }
  });

  /* ---------------- Verrouillage façon téléphone ---------------- */
  let pinBuffer = '', lockClock = null, unlocking = false;
  function lock(fromExpiry) {
    if (!store.ticket) { logout(true); return; }
    store.session = null;
    S.locked = true;
    clearTimeout(idleTimer);
    closeModals();
    const u = store.user || {};
    $('#lockAvatar').textContent = initials(u.name);
    $('#lockName').textContent = u.name || 'Mwinue Asimame';
    setHint(fromExpiry === true ? 'Session verrouillée. Saisissez votre code PIN.' : 'Saisissez votre code PIN');
    pinBuffer = ''; drawDots();
    tickLock(); clearInterval(lockClock); lockClock = setInterval(tickLock, 1000);
    show('screenLock');
  }
  function tickLock() {
    const now = new Date();
    $('#lockTime').textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    $('#lockDate').textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function setHint(t, err) { const h = $('#lockHint'); h.textContent = t; h.classList.toggle('is-error', !!err); }
  function drawDots() {
    const n = Math.max(store.pinLen || 4, pinBuffer.length);
    $('#pinDots').innerHTML = Array.from({ length: n }, (_, i) => '<span class="' + (i < pinBuffer.length ? 'filled' : '') + '"></span>').join('');
  }
  async function tryUnlock() {
    if (unlocking || pinBuffer.length < 4) return;
    unlocking = true;
    setHint('Vérification…');
    try {
      const r = await api('auth?a=unlock', { auth: 'ticket', body: { pin: pinBuffer } });
      store.session = r.session; store.pinLen = pinBuffer.length;
      pinBuffer = ''; S.locked = false; clearInterval(lockClock);
      await loadMe(); enterApp();
    } catch (err) {
      pinBuffer = ''; drawDots();
      const dots = $('#pinDots'); dots.classList.remove('shake'); void dots.offsetWidth; dots.classList.add('shake');
      if (navigator.vibrate) navigator.vibrate(200);
      if (err.status === 401) { setHint(err.message, true); setTimeout(() => logout(true, err.message), 1800); }
      else setHint(err.message, true);
    } finally { unlocking = false; }
  }
  function pressKey(k) {
    if (S.locked !== true) return;
    if (k === 'del') pinBuffer = pinBuffer.slice(0, -1);
    else if (k === 'ok') return tryUnlock();
    else if (/^\d$/.test(k) && pinBuffer.length < 6) pinBuffer += k;
    drawDots();
    if (store.pinLen && pinBuffer.length === store.pinLen) tryUnlock();
  }
  $('#keypad').addEventListener('click', e => { const b = e.target.closest('[data-key]'); if (b) pressKey(b.dataset.key); });
  document.addEventListener('keydown', e => {
    if (S.locked && !$('#screenLock').hidden) {
      if (/^\d$/.test(e.key)) { pressKey(e.key); flashKey(e.key); }
      else if (e.key === 'Backspace') pressKey('del');
      else if (e.key === 'Enter') pressKey('ok');
      return;
    }
    if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l') && S.user) { e.preventDefault(); lock(); }
  });
  function flashKey(k) { const b = $('#keypad [data-key="' + k + '"]'); if (b) { b.classList.add('pressed'); setTimeout(() => b.classList.remove('pressed'), 120); } }
  $('#lockUsePassword').addEventListener('click', () => logout(true));

  function logout(silent, msg) {
    store.session = null; store.ticket = null; S.user = null; S.locked = false;
    clearInterval(lockClock); clearTimeout(idleTimer); closeModals();
    show('screenLogin');
    formError($('#loginForm'), msg || '');
    if (!silent) toast('Vous êtes déconnecté(e).');
  }
  function closeModals() { $$('.modal.show').forEach(m => { const i = bootstrap.Modal.getInstance(m); if (i) i.hide(); }); }

  // Verrouillage automatique après inactivité
  let idleTimer = null;
  function resetIdle() {
    if (S.locked || !S.user || $('#screenApp').hidden) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (!S.locked && S.user) lock(); }, Math.max(1, S.autoLock) * 60000);
  }
  ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(ev => document.addEventListener(ev, resetIdle, { passive: true }));
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt && S.user && !S.locked && Date.now() - hiddenAt > Math.max(1, S.autoLock) * 60000) lock();
  });

  /* ---------------- Navigation ---------------- */
  const NAV = [
    { group: 'Général' },
    { id: 'dashboard', label: 'Tableau de bord', icon: 'speedometer2' },
    { id: 'home', label: "Page d'accueil", icon: 'house-heart', perm: 'home' },
    { group: 'Contenus' },
    { id: 'realisations', label: 'Réalisations', icon: 'flag', perm: 'realisations' },
    { id: 'articles', label: 'Actualités', icon: 'newspaper', perm: 'articles' },
    { id: 'gallery', label: 'Galerie', icon: 'images', perm: 'gallery' },
    { id: 'media', label: 'Médiathèque', icon: 'folder2-open', perm: 'media' },
    { group: 'Association' },
    { id: 'team', label: 'Équipe', icon: 'people', perm: 'team' },
    { id: 'partners', label: 'Partenaires', icon: 'buildings', perm: 'partners' },
    { id: 'testimonials', label: 'Témoignages', icon: 'chat-quote', perm: 'testimonials' },
    { id: 'impact', label: 'Impact', icon: 'graph-up-arrow', perm: 'impact' },
    { group: 'Interactions' },
    { id: 'comments', label: 'Commentaires', icon: 'chat-dots', perm: 'comments', badge: 'pending_comments' },
    { id: 'messages', label: 'Messages', icon: 'envelope', perm: 'messages', badge: 'unread_messages' },
    { id: 'subscribers', label: 'Abonnés newsletter', icon: 'send-check', perm: 'subscribers' },
    { id: 'donations', label: 'Dons & paiements', icon: 'cash-coin', perm: 'donations' },
    { group: 'Configuration' },
    { id: 'settings', label: 'Coordonnées & paramètres', icon: 'gear', perm: 'settings' },
    { id: 'users', label: 'Utilisateurs', icon: 'person-lock', admin: true },
    { id: 'audit', label: "Journal d'activité", icon: 'clock-history', admin: true },
    { id: 'account', label: 'Mon compte', icon: 'person-gear' }
  ];
  function allowed(item) { return item.admin ? S.user.role === 'admin' : (!item.perm || can(item.perm)); }

  function renderNav(active) {
    const counts = (S.dashboard && S.dashboard.counts) || {};
    let html = '', pendingGroup = null;
    NAV.forEach(it => {
      if (it.group) { pendingGroup = it.group; return; }
      if (!allowed(it)) return;
      if (pendingGroup) { html += '<div class="nav-group">' + esc(pendingGroup) + '</div>'; pendingGroup = null; }
      const n = it.badge ? counts[it.badge] : 0;
      html += '<a href="#' + it.id + '" class="' + (it.id === active ? 'active' : '') + '"><i class="bi bi-' + it.icon + '"></i>' + esc(it.label) + (n ? '<span class="badge rounded-pill">' + n + '</span>' : '') + '</a>';
    });
    $('#sidebarNav').innerHTML = html;
  }

  function enterApp() {
    S.locked = false;
    show('screenApp');
    $('#userName').textContent = S.user.name;
    $('#userAvatar').textContent = initials(S.user.name);
    $('#userRole').textContent = S.user.role === 'admin' ? 'Administrateur' : 'Communicateur';
    resetIdle();
    route();
    refreshCounts();
  }
  async function refreshCounts() {
    try { S.dashboard = await api('admin?r=dashboard'); S.foundedAt = S.dashboard.founded_at; renderNav(currentRoute()); } catch (e) { /* */ }
  }

  function currentRoute() { return (location.hash || '#dashboard').slice(1).split('?')[0] || 'dashboard'; }
  window.addEventListener('hashchange', () => { if (S.user && !S.locked) route(); });
  function route() {
    let id = currentRoute();
    const item = NAV.find(n => n.id === id);
    if (!item || !allowed(item)) id = 'dashboard';
    renderNav(id);
    const it = NAV.find(n => n.id === id);
    $('#pageTitle').textContent = it.label;
    document.title = it.label + ' — Administration MWAS';
    S.charts.forEach(c => c.destroy()); S.charts = [];
    $('#sidebar').classList.remove('open'); $('#sidebarBackdrop').classList.remove('open');
    const old = $('#view');
    const view = old.cloneNode(false); old.parentNode.replaceChild(view, old); // retire les anciens écouteurs
    view.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-brand"></div></div>';
    Promise.resolve(VIEWS[id](view)).catch(err => { view.innerHTML = '<div class="panel"><p class="text-danger mb-0"><i class="bi bi-exclamation-triangle me-2"></i>' + esc(err.message) + '</p></div>'; });
    view.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  $('#menuToggle').addEventListener('click', () => { $('#sidebar').classList.add('open'); $('#sidebarBackdrop').classList.add('open'); });
  $('#sidebarBackdrop').addEventListener('click', () => { $('#sidebar').classList.remove('open'); $('#sidebarBackdrop').classList.remove('open'); });
  $('#lockBtn').addEventListener('click', () => lock());
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-action]');
    if (!a) return;
    if (a.dataset.action === 'lock') lock();
    if (a.dataset.action === 'logout') logout(false);
  });

  /* ---------------- Recherche globale ---------------- */
  (function globalSearch() {
    const box = $('#globalSearch'), input = $('#globalSearchInput'), out = $('#globalSearchResults');
    const ICONS = { realisations: 'flag', articles: 'newspaper', gallery: 'images', team: 'people', partners: 'buildings', testimonials: 'chat-quote', impact: 'graph-up-arrow', comments: 'chat-dots', messages: 'envelope', subscribers: 'send-check', donations: 'cash-coin', users: 'person-lock', nav: 'arrow-right-circle' };
    const OPENABLE = ['realisations', 'articles', 'gallery', 'team', 'partners', 'testimonials', 'impact'];
    let timer, seq = 0, active = -1;
    function linkFor(key, it, q) {
      if (key === 'nav') return '#' + it.id;
      if (OPENABLE.includes(key)) return '#' + key + '?open=' + encodeURIComponent(it.id);
      if (key === 'users') return '#users';
      return '#' + key + '?q=' + encodeURIComponent(key === 'donations' || key === 'subscribers' || key === 'messages' ? q : it.title);
    }
    function close() { out.hidden = true; active = -1; }
    function render(groups, q) {
      const nq = q.toLowerCase();
      const nav = NAV.filter(n => n.id && allowed(n) && n.label.toLowerCase().includes(nq)).slice(0, 4).map(n => ({ id: n.id, title: n.label, sub: 'Ouvrir l’onglet', icon: n.icon }));
      if (nav.length) groups = [{ key: 'nav', label: 'Aller à', items: nav }].concat(groups);
      if (!groups.length) { out.innerHTML = '<div class="gr-empty">Aucun résultat pour « ' + esc(q) + ' ».</div>'; out.hidden = false; return; }
      out.innerHTML = groups.map(g => '<div class="gr-group"><span>' + esc(g.label) + '</span>' + (g.total > g.items.length ? '<a class="p-0 small" style="display:inline" href="#' + g.key + '?q=' + encodeURIComponent(q) + '">Voir les ' + g.total + '</a>' : '') + '</div>' +
        g.items.map(it => '<a href="' + esc(linkFor(g.key, it, q)) + '" role="option">' + (it.image ? '<img src="' + esc(src(it.image)) + '" alt="">' : '<span class="gr-ico"><i class="bi bi-' + (it.icon || ICONS[g.key] || 'dot') + '"></i></span>') +
          '<span class="min-w-0"><span class="gr-title d-block">' + esc(it.title) + '</span><span class="gr-sub d-block">' + esc(it.sub) + '</span></span></a>').join('')).join('');
      out.hidden = false;
    }
    async function run() {
      const q = input.value.trim();
      if (q.length < 2) { close(); return; }
      const my = ++seq;
      out.innerHTML = '<div class="gr-empty"><span class="spinner-border spinner-border-sm me-2"></span>Recherche…</div>'; out.hidden = false;
      try { const r = await api('admin?r=search&q=' + encodeURIComponent(q)); if (my === seq) render(r.groups, q); }
      catch (e) { if (my === seq) { out.innerHTML = '<div class="gr-empty">' + esc(e.message) + '</div>'; } }
    }
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 250); });
    input.addEventListener('focus', () => { if (input.value.trim().length >= 2 && out.innerHTML) out.hidden = false; });
    input.addEventListener('keydown', e => {
      const links = $$('a[role=option]', out);
      if (e.key === 'Escape') { close(); input.blur(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!links.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links.forEach((l, i) => l.classList.toggle('is-active', i === active)); links[active].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter') { e.preventDefault(); const l = links[active >= 0 ? active : 0]; if (l) { location.hash = l.getAttribute('href'); close(); input.blur(); box.classList.remove('open'); } }
    });
    out.addEventListener('click', e => { if (e.target.closest('a')) { close(); box.classList.remove('open'); } });
    document.addEventListener('click', e => { if (!box.contains(e.target) && !e.target.closest('#searchToggle')) { close(); box.classList.remove('open'); } });
    $('#searchToggle').addEventListener('click', () => { box.classList.toggle('open'); if (box.classList.contains('open')) input.focus(); });
    document.addEventListener('keydown', e => {
      if (S.locked || !S.user || $('#screenApp').hidden) return;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); box.classList.add('open'); input.focus(); input.select(); }
    });
  })();

  /* ---------------- Temps d'existence ---------------- */
  function existence(from) {
    if (!from) return null;
    const start = new Date(from), now = new Date();
    if (isNaN(start) || start > now) return null;
    let y = now.getFullYear() - start.getFullYear(), m = now.getMonth() - start.getMonth(), d = now.getDate() - start.getDate();
    if (d < 0) { m -= 1; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (m < 0) { y -= 1; m += 12; }
    const secs = Math.floor((now - start) / 1000);
    const rem = secs % 86400;
    const hh = String(Math.floor(rem / 3600)).padStart(2, '0'), mm = String(Math.floor((rem % 3600) / 60)).padStart(2, '0'), ss = String(rem % 60).padStart(2, '0');
    return { y, m, d, secs, hh, mm, ss, months: y * 12 + m, days: Math.floor(secs / 86400) };
  }
  function existenceText(e) {
    if (!e) return '—';
    const parts = [];
    if (e.y) parts.push(e.y + (e.y > 1 ? ' ans' : ' an'));
    if (e.m) parts.push(e.m + ' mois');
    parts.push(e.d + (e.d > 1 ? ' jours' : ' jour'));
    return parts.join(' ') + ' · ' + e.hh + ' h ' + e.mm + ' min ' + e.ss + ' s';
  }
  setInterval(() => {
    const e = existence(S.foundedAt);
    const chip = $('#existenceChip span'); if (chip) chip.textContent = e ? existenceText(e) : '';
    const big = $('#existenceBig'); if (big) big.textContent = existenceText(e);
    const sec = $('#existenceSecs'); if (sec && e) sec.textContent = fmtNum(e.days) + ' jours · ' + fmtNum(e.secs) + ' secondes';
  }, 1000);

  /* ---------------- Téléversement ---------------- */
  async function compressImage(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 600 * 1024 || !window.createImageBitmap) return file;
    try {
      const bmp = await createImageBitmap(file);
      const max = 2000, ratio = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bmp.width * ratio); canvas.height = Math.round(bmp.height * ratio);
      canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const blob = await new Promise(r => canvas.toBlob(r, type, 0.86));
      if (!blob || blob.size >= file.size) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + (type === 'image/png' ? '.png' : '.jpg'), { type });
    } catch (e) { return file; }
  }
  async function uploadFile(file, folder, onProgress) {
    if (file.size > 10 * 1024 * 1024) throw new Error('Fichier trop lourd (10 Mo maximum).');
    const f = await compressImage(file);
    const sign = await api('admin?r=upload', { body: { filename: f.name, contentType: f.type, folder } });
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', sign.uploadUrl);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.upload.onprogress = e => { if (onProgress && e.lengthComputable) onProgress(e.loaded / e.total); };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error('Échec du téléversement (' + xhr.status + ').'));
      xhr.onerror = () => reject(new Error('Échec du téléversement (réseau).'));
      const fd = new FormData();
      fd.append('cacheControl', '31536000');
      fd.append('', f);
      xhr.send(fd);
    });
    return sign.publicUrl;
  }
  function pickFiles(accept, multiple) {
    return new Promise(resolve => {
      const i = document.createElement('input');
      i.type = 'file'; i.accept = accept || 'image/*'; i.multiple = !!multiple;
      i.onchange = () => resolve(Array.from(i.files || []));
      i.click();
    });
  }

  /* ---------------- Formulaires génériques ---------------- */
  function fieldHtml(f, value) {
    const id = 'f_' + f.name;
    const help = f.help ? '<div class="help">' + esc(f.help) + '</div>' : '';
    const label = '<label class="form-label" for="' + id + '">' + esc(f.label) + (f.required ? ' <span class="text-danger">*</span>' : '') + '</label>';
    const col = f.col || 'col-12';
    const v = value === undefined || value === null ? (f.default !== undefined ? f.default : '') : value;
    let input = '';
    switch (f.type) {
      case 'section': return '<div class="col-12"><div class="section-sep">' + esc(f.label) + '</div></div>';
      case 'textarea':
        input = '<textarea class="form-control" id="' + id + '" name="' + f.name + '" rows="' + (f.rows || 4) + '"' + (f.required ? ' required' : '') + (f.max ? ' maxlength="' + f.max + '"' : '') + '>' + esc(v) + '</textarea>'; break;
      case 'number':
        input = '<input class="form-control" type="number" step="' + (f.step || 'any') + '" id="' + id + '" name="' + f.name + '" value="' + esc(v) + '">'; break;
      case 'date':
        input = '<input class="form-control" type="date" id="' + id + '" name="' + f.name + '" value="' + esc(v ? String(v).slice(0, 10) : '') + '">'; break;
      case 'datetime': {
        let lv = '';
        if (v) { const d = new Date(v); if (!isNaN(d)) lv = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
        input = '<input class="form-control" type="datetime-local" id="' + id + '" name="' + f.name + '" value="' + lv + '">'; break;
      }
      case 'bool':
        return '<div class="' + col + ' field"><div class="form-check form-switch mt-md-4"><input class="form-check-input" type="checkbox" role="switch" id="' + id + '" name="' + f.name + '"' + (v === true ? ' checked' : '') + (f.disabled ? ' disabled' : '') + '><label class="form-check-label" for="' + id + '">' + esc(f.label) + '</label></div>' + help + '</div>';
      case 'select':
        input = '<select class="form-select" id="' + id + '" name="' + f.name + '">' + f.options.map(o => { const ov = Array.isArray(o) ? o[0] : o, ol = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(ov) + '"' + (String(v) === String(ov) ? ' selected' : '') + '>' + esc(ol) + '</option>'; }).join('') + '</select>'; break;
      case 'color':
        input = '<input class="form-control form-control-color" type="color" id="' + id + '" name="' + f.name + '" value="' + esc(v || '#A5481D') + '">'; break;
      case 'image':
        input = '<div class="img-field" data-image-field="' + f.name + '"><img class="img-preview" src="' + esc(src(v)) + '" alt="" onerror="this.style.opacity=.3"><div class="img-controls">' +
          '<input class="form-control mb-2" id="' + id + '" name="' + f.name + '" value="' + esc(v) + '" placeholder="URL de l\'image ou img/…">' +
          '<button type="button" class="btn btn-soft btn-sm" data-upload="' + f.name + '" data-folder="' + esc(f.folder || 'divers') + '"><i class="bi bi-upload me-1"></i>Téléverser une image</button> ' +
          '<button type="button" class="btn btn-light btn-sm" data-clear-image="' + f.name + '"><i class="bi bi-x"></i> Retirer</button>' +
          '<div class="upload-progress" hidden><span></span></div></div></div>'; break;
      case 'images': {
        const arr = Array.isArray(v) ? v : [];
        input = '<div data-images-field="' + f.name + '" data-folder="' + esc(f.folder || 'divers') + '"><div class="gallery-editor">' + arr.map(imgItem).join('') + '</div>' +
          '<button type="button" class="btn btn-soft btn-sm mt-2" data-add-images><i class="bi bi-images me-1"></i>Ajouter des images</button> ' +
          '<button type="button" class="btn btn-light btn-sm mt-2" data-add-image-url><i class="bi bi-link-45deg me-1"></i>Ajouter par URL</button><div class="upload-progress" hidden><span></span></div></div>';
        break;
      }
      case 'list': case 'pairs': {
        const arr = Array.isArray(v) ? v : [];
        input = '<div class="list-editor" data-list-field="' + f.name + '"><div class="list-rows">' + arr.map(x => listRow(f, x)).join('') + '</div>' +
          '<button type="button" class="btn btn-soft btn-sm" data-add-row><i class="bi bi-plus-lg me-1"></i>' + esc(f.addLabel || 'Ajouter') + '</button></div>';
        break;
      }
      case 'tags':
        input = '<input class="form-control" id="' + id + '" name="' + f.name + '" value="' + esc(Array.isArray(v) ? v.join(', ') : v) + '" placeholder="mot 1, mot 2, mot 3">'; break;
      default:
        input = '<input class="form-control" type="' + (f.type === 'url' ? 'text' : (f.type || 'text')) + '" id="' + id + '" name="' + f.name + '" value="' + esc(v) + '"' + (f.required ? ' required' : '') + (f.max ? ' maxlength="' + f.max + '"' : '') + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + (f.type === 'password' ? ' autocomplete="new-password"' : '') + '>';
    }
    return '<div class="' + col + ' field">' + label + input + help + '</div>';
  }
  function imgItem(u) { return '<div class="g-item" data-url="' + esc(u) + '"><img src="' + esc(src(u)) + '" alt=""><button type="button" class="btn btn-danger btn-sm" data-remove-image aria-label="Retirer"><i class="bi bi-x"></i></button></div>'; }
  function listRow(f, x) {
    const labels = f.labels || [];
    const vals = f.type === 'pairs' ? (Array.isArray(x) ? x : [x, '']) : [x];
    const inputs = vals.map((val, i) => {
      const long = f.type === 'pairs' ? i === 1 : (f.long !== false);
      return long ? '<textarea class="form-control form-control-sm" rows="2" placeholder="' + esc(labels[i] || '') + '">' + esc(val) + '</textarea>'
        : '<input class="form-control form-control-sm" placeholder="' + esc(labels[i] || '') + '" value="' + esc(val) + '">';
    }).join('');
    return '<div class="list-row"><div class="inputs">' + inputs + '</div><div class="btns"><button type="button" class="btn btn-light" data-move="-1" aria-label="Monter"><i class="bi bi-arrow-up"></i></button><button type="button" class="btn btn-light" data-move="1" aria-label="Descendre"><i class="bi bi-arrow-down"></i></button><button type="button" class="btn btn-outline-danger" data-remove-row aria-label="Supprimer"><i class="bi bi-trash"></i></button></div></div>';
  }
  function buildForm(container, fields, item) {
    container.innerHTML = '<div class="row g-3">' + fields.map(f => fieldHtml(f, item ? item[f.name] : undefined)).join('') + '</div>';
    if (!container.dataset.wired) { wireForm(container, () => container._fields); container.dataset.wired = '1'; }
    container._fields = fields;
  }
  function wireForm(container, getFields) {
    container.addEventListener('click', async e => {
      const up = e.target.closest('[data-upload]');
      if (up) {
        const files = await pickFiles('image/*');
        if (!files.length) return;
        const wrap = up.closest('[data-image-field]'), bar = $('.upload-progress', wrap);
        bar.hidden = false; up.disabled = true;
        try {
          const url = await uploadFile(files[0], up.dataset.folder, p => { $('span', bar).style.width = Math.round(p * 100) + '%'; });
          $('input', wrap).value = url; $('img', wrap).src = url; $('img', wrap).style.opacity = 1;
          toast('Image téléversée.');
        } catch (err) { toast(err.message, 'error'); } finally { bar.hidden = true; up.disabled = false; }
        return;
      }
      const clr = e.target.closest('[data-clear-image]');
      if (clr) { const w = clr.closest('[data-image-field]'); $('input', w).value = ''; $('img', w).removeAttribute('src'); return; }
      const addImgs = e.target.closest('[data-add-images]');
      if (addImgs) {
        const w = addImgs.closest('[data-images-field]'), bar = $('.upload-progress', w);
        const files = await pickFiles('image/*', true);
        if (!files.length) return;
        bar.hidden = false;
        for (let i = 0; i < files.length; i++) {
          try {
            const url = await uploadFile(files[i], w.dataset.folder, p => { $('span', bar).style.width = Math.round(((i + p) / files.length) * 100) + '%'; });
            $('.gallery-editor', w).insertAdjacentHTML('beforeend', imgItem(url));
          } catch (err) { toast(err.message, 'error'); }
        }
        bar.hidden = true;
        return;
      }
      const addUrl = e.target.closest('[data-add-image-url]');
      if (addUrl) { const u = prompt("URL de l'image (https://… ou img/…)"); if (u) $('.gallery-editor', addUrl.closest('[data-images-field]')).insertAdjacentHTML('beforeend', imgItem(u.trim())); return; }
      const rmImg = e.target.closest('[data-remove-image]');
      if (rmImg) { rmImg.closest('.g-item').remove(); return; }
      const addRow = e.target.closest('[data-add-row]');
      if (addRow) {
        const le = addRow.closest('[data-list-field]');
        const f = getFields().find(x => x.name === le.dataset.listField);
        $('.list-rows', le).insertAdjacentHTML('beforeend', listRow(f, f.type === 'pairs' ? ['', ''] : ''));
        const inp = $('input,textarea', $('.list-rows', le).lastElementChild); if (inp) inp.focus();
        return;
      }
      const rmRow = e.target.closest('[data-remove-row]');
      if (rmRow) { rmRow.closest('.list-row').remove(); return; }
      const mv = e.target.closest('[data-move]');
      if (mv) {
        const row = mv.closest('.list-row');
        if (mv.dataset.move === '-1' && row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
        if (mv.dataset.move === '1' && row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
      }
    });
    container.addEventListener('input', e => {
      const w = e.target.closest('[data-image-field]');
      if (w && e.target.tagName === 'INPUT') { $('img', w).src = src(e.target.value); $('img', w).style.opacity = 1; }
    });
  }
  function readForm(container, fields) {
    const out = {};
    fields.forEach(f => {
      if (f.type === 'section' || f.readonly) return;
      const el = container.querySelector('[name="' + f.name + '"]');
      switch (f.type) {
        case 'bool': out[f.name] = !!(el && el.checked); break;
        case 'number': out[f.name] = el && el.value !== '' ? Number(el.value) : (f.default !== undefined ? f.default : 0); break;
        case 'tags': out[f.name] = el ? el.value.split(',').map(s => s.trim()).filter(Boolean) : []; break;
        case 'datetime': out[f.name] = el && el.value ? new Date(el.value).toISOString() : null; break;
        case 'date': out[f.name] = el && el.value ? el.value : null; break;
        case 'images': out[f.name] = $$('[data-images-field="' + f.name + '"] .g-item', container).map(i => i.dataset.url); break;
        case 'list': out[f.name] = $$('[data-list-field="' + f.name + '"] .list-row', container).map(r => $('input,textarea', r).value.trim()).filter(Boolean); break;
        case 'pairs': out[f.name] = $$('[data-list-field="' + f.name + '"] .list-row', container).map(r => $$('input,textarea', r).map(i => i.value.trim())).filter(p => p[0] || p[1]); break;
        default: out[f.name] = el ? el.value.trim() : '';
      }
      if (f.required && (out[f.name] === '' || out[f.name] === null)) throw new Error('Le champ « ' + f.label + ' » est obligatoire.');
    });
    return out;
  }

  const editModal = () => bootstrap.Modal.getOrCreateInstance($('#editModal'));
  function openEditor(title, fields, item, onSave) {
    $('#editTitle').textContent = title;
    $('#editError').textContent = '';
    const old = $('#editBody');
    const body = old.cloneNode(false); body.removeAttribute('data-wired'); old.parentNode.replaceChild(body, old);
    buildForm(body, fields, item);
    $('#editForm').onsubmit = async e => {
      e.preventDefault();
      const btn = $('#editSave');
      $('#editError').textContent = '';
      let values;
      try { values = readForm(body, fields); } catch (err) { $('#editError').textContent = err.message; return; }
      busy(btn, true, 'Enregistrement…');
      try { await onSave(values); editModal().hide(); } catch (err) { $('#editError').textContent = err.message; } finally { busy(btn, false); }
    };
    editModal().show();
  }
  function infoModal(title, html) {
    $('#infoTitle').textContent = title; $('#infoBody').innerHTML = html;
    bootstrap.Modal.getOrCreateInstance($('#infoModal')).show();
  }
  function confirmDel(what) { return confirm('Supprimer définitivement ' + what + ' ? Cette action est irréversible.'); }

  /* ---------------- Définition des contenus ---------------- */
  const publishField = { name: 'published', label: 'Publié sur le site', type: 'bool', default: true, col: 'col-md-4' };
  const audienceCell = i => '<td class="text-nowrap small"><i class="bi bi-eye me-1"></i>' + fmtNum(i.views) + ' <i class="bi bi-heart ms-2 me-1"></i>' + fmtNum(i.likes) + '</td>';
  const DEFS = {
    realisations: {
      title: 'réalisation', viewUrl: i => '/realisation-details.html?realisation=' + encodeURIComponent(i.slug),
      cols: i => '<div class="d-flex gap-2 align-items-center"><img class="thumb" src="' + esc(src(i.image)) + '" alt=""><div><div class="cell-title">' + esc(i.title) + '</div><div class="cell-sub">' + esc(i.category || '') + (i.event_date ? ' · ' + fmtDate(i.event_date) : '') + '</div></div></div>',
      extra: audienceCell, extraHead: '<th>Audience</th>',
      fields: [
        { type: 'section', label: 'Carte et en-tête' },
        { name: 'title', label: 'Titre', required: true, col: 'col-md-8', max: 200 },
        { name: 'category', label: 'Catégorie', col: 'col-md-4', placeholder: 'Ex. Octobre Rose 2026' },
        { name: 'heading', label: 'Sous-titre de la page détail', col: 'col-md-8' },
        { name: 'event_date', label: "Date de l'activité", type: 'date', col: 'col-md-4' },
        { name: 'location', label: 'Lieu', col: 'col-md-6' },
        { name: 'slug', label: 'Adresse (slug)', col: 'col-md-6', help: 'Laissé vide, il est créé à partir du titre.' },
        { name: 'image', label: 'Image de couverture (carte)', type: 'image', folder: 'realisations' },
        { name: 'summary', label: 'Résumé (dos de la carte)', type: 'textarea', rows: 3 },
        { name: 'description', label: 'Description courte (référencement Google)', type: 'textarea', rows: 2 },
        { type: 'section', label: 'Contenu détaillé' },
        { name: 'gallery', label: 'Images de la page détail (la 1re sert d’image principale)', type: 'images', folder: 'realisations' },
        { name: 'intro', label: "Paragraphes d'introduction", type: 'list', labels: ['Paragraphe'], addLabel: 'Ajouter un paragraphe' },
        { name: 'features_heading', label: 'Titre de la section « temps forts »' },
        { name: 'features', label: 'Temps forts', type: 'pairs', labels: ['Titre', 'Description'], addLabel: 'Ajouter un temps fort' },
        { name: 'process_heading', label: 'Titre de la section « étapes »' },
        { name: 'steps', label: 'Étapes', type: 'pairs', labels: ['Étape', 'Description'], addLabel: 'Ajouter une étape' },
        { name: 'faq_heading', label: 'Titre de la FAQ' },
        { name: 'questions', label: 'Questions fréquentes', type: 'pairs', labels: ['Question', 'Réponse'], addLabel: 'Ajouter une question' },
        { type: 'section', label: 'Publication' },
        publishField,
        { name: 'featured', label: "Mettre en avant sur l'accueil", type: 'bool', col: 'col-md-4' },
        { name: 'sort', label: "Ordre d'affichage", type: 'number', step: 1, col: 'col-md-4', default: 0 }
      ]
    },
    articles: {
      title: 'actualité', viewUrl: i => '/blog-detail.html?article=' + encodeURIComponent(i.slug),
      cols: i => '<div class="d-flex gap-2 align-items-center"><img class="thumb" src="' + esc(src(i.image)) + '" alt=""><div><div class="cell-title">' + esc(i.title) + '</div><div class="cell-sub">' + esc(i.category || '') + ' · ' + fmtDate(i.published_at) + '</div></div></div>',
      extra: audienceCell, extraHead: '<th>Audience</th>',
      fields: [
        { name: 'title', label: 'Titre', required: true, col: 'col-md-8', max: 200 },
        { name: 'category', label: 'Catégorie / étiquette', col: 'col-md-4', placeholder: 'Ex. Santé' },
        { name: 'image', label: 'Image', type: 'image', folder: 'articles' },
        { name: 'alt', label: "Description de l'image (accessibilité)", col: 'col-md-8' },
        { name: 'read_minutes', label: 'Lecture (minutes)', type: 'number', step: 1, col: 'col-md-4', default: 4 },
        { name: 'excerpt', label: 'Extrait (liste des actualités)', type: 'textarea', rows: 2 },
        { name: 'intro', label: 'Chapeau / introduction', type: 'textarea', rows: 3 },
        { name: 'paragraphs', label: 'Paragraphes', type: 'list', labels: ['Paragraphe'], addLabel: 'Ajouter un paragraphe' },
        { name: 'takeaway', label: 'À retenir', type: 'textarea', rows: 2 },
        { name: 'tags', label: 'Mots-clés (séparés par des virgules)', type: 'tags' },
        { name: 'author_name', label: 'Auteur affiché', col: 'col-md-6', default: 'Mwinue Asimame' },
        { name: 'published_at', label: 'Date de publication', type: 'datetime', col: 'col-md-6', help: 'Une date future programme la publication.' },
        { name: 'slug', label: 'Adresse (slug)', col: 'col-md-6' },
        { name: 'sort', label: 'Ordre', type: 'number', step: 1, col: 'col-md-2', default: 0 },
        publishField
      ]
    },
    gallery: {
      title: 'photo',
      viewUrl: i => i.legacy_key ? '/portfolio-single.html?photo=' + encodeURIComponent(i.legacy_key) : '/portfolio-single.html?id=' + i.id,
      cols: i => '<div class="d-flex gap-2 align-items-center"><img class="thumb" src="' + esc(src(i.image)) + '" alt=""><div><div class="cell-title">' + esc(i.title) + '</div><div class="cell-sub">' + esc(({ sante: 'Santé et Bien-être', droits: 'Droits', formations: 'Autonomisation' })[i.category] || i.category) + (i.event_date ? ' · ' + fmtDate(i.event_date) : '') + '</div></div></div>',
      fields: [
        { name: 'image', label: 'Photo', type: 'image', folder: 'gallery', required: true },
        { name: 'title', label: 'Titre', required: true, col: 'col-md-8' },
        { name: 'category', label: 'Catégorie (filtre)', type: 'select', options: [['sante', 'Santé et Bien-être'], ['droits', 'Droits'], ['formations', 'Autonomisation']], col: 'col-md-4' },
        { name: 'label', label: 'Sur-titre de la carte', col: 'col-md-6', placeholder: 'Mwinue Asimame · Santé' },
        { name: 'theme', label: 'Thème', col: 'col-md-6' },
        { name: 'event_date', label: 'Date', type: 'date', col: 'col-md-4' },
        { name: 'alt', label: 'Texte alternatif', col: 'col-md-8' },
        { name: 'description', label: 'Détails de la photo', type: 'textarea', rows: 4 },
        { name: 'tags', label: 'Mots-clés', type: 'tags' },
        { name: 'sort', label: 'Ordre', type: 'number', step: 1, col: 'col-md-4', default: 0 },
        publishField
      ]
    },
    team: {
      title: 'membre',
      cols: i => '<div class="d-flex gap-2 align-items-center"><img class="thumb-round" src="' + esc(src(i.photo)) + '" alt=""><div><div class="cell-title">' + esc(i.name) + '</div><div class="cell-sub">' + esc(i.role || '') + '</div></div></div>',
      fields: [
        { name: 'photo', label: 'Photo', type: 'image', folder: 'team' },
        { name: 'name', label: 'Nom', required: true, col: 'col-md-6' },
        { name: 'role', label: 'Fonction', col: 'col-md-6' },
        { name: 'bio', label: 'Présentation', type: 'textarea', rows: 4 },
        { name: 'sort', label: 'Ordre', type: 'number', step: 1, col: 'col-md-4', default: 0 },
        publishField
      ]
    },
    partners: {
      title: 'partenaire',
      cols: i => '<div class="d-flex gap-2 align-items-center"><img class="thumb" style="object-fit:contain;background:#fff" src="' + esc(src(i.logo)) + '" alt=""><div><div class="cell-title">' + esc(i.name) + '</div><div class="cell-sub">' + esc(i.url || '') + '</div></div></div>',
      fields: [
        { name: 'logo', label: 'Logo', type: 'image', folder: 'partners' },
        { name: 'name', label: 'Nom', required: true, col: 'col-md-6' },
        { name: 'url', label: 'Site web', type: 'url', col: 'col-md-6', placeholder: 'https://' },
        { name: 'sort', label: 'Ordre', type: 'number', step: 1, col: 'col-md-4', default: 0 },
        publishField
      ]
    },
    testimonials: {
      title: 'témoignage',
      cols: i => '<div class="d-flex gap-2 align-items-center"><img class="thumb-round" src="' + esc(src(i.photo)) + '" alt=""><div><div class="cell-title">' + esc(i.name) + '</div><div class="cell-sub">' + esc((i.content || '').slice(0, 90)) + '…</div></div></div>',
      fields: [
        { name: 'photo', label: 'Photo', type: 'image', folder: 'testimonials' },
        { name: 'name', label: 'Nom', required: true, col: 'col-md-6' },
        { name: 'role', label: 'Fonction', col: 'col-md-6' },
        { name: 'content', label: 'Témoignage', type: 'textarea', rows: 4, required: true },
        { name: 'rating', label: 'Note (1 à 5)', type: 'number', step: 1, col: 'col-md-4', default: 5 },
        { name: 'sort', label: 'Ordre', type: 'number', step: 1, col: 'col-md-4', default: 0 },
        publishField
      ]
    },
    impact_metrics: {
      title: 'indicateur',
      cols: i => { const p = Math.min(100, (Number(i.value) / (Number(i.target) || 1)) * 100); return '<div class="cell-title">' + esc(i.label) + '</div><div class="d-flex align-items-center gap-2 mt-1"><div class="progress flex-grow-1" style="height:8px;max-width:260px"><div class="progress-bar" style="width:' + p + '%;background:' + esc(i.color || '#A5481D') + '"></div></div><span class="small fw-semibold">' + p.toFixed(1) + ' %</span></div><div class="cell-sub">' + fmtNum(i.value) + ' / ' + fmtNum(i.target) + ' ' + esc(i.unit || '') + '</div>'; },
      fields: [
        { name: 'label', label: 'Indicateur', required: true, placeholder: 'Ex. Femmes sensibilisées' },
        { name: 'value', label: 'Valeur atteinte', type: 'number', col: 'col-md-4' },
        { name: 'target', label: 'Objectif', type: 'number', col: 'col-md-4', default: 100 },
        { name: 'unit', label: 'Unité', col: 'col-md-4', placeholder: 'femmes, activités, %' },
        { name: 'color', label: 'Couleur du graphique', type: 'color', col: 'col-md-4' },
        { name: 'sort', label: 'Ordre', type: 'number', step: 1, col: 'col-md-4', default: 0 },
        publishField
      ]
    }
  };

  /* ---------------- Pagination, filtres et paramètres d'URL ---------------- */
  function hashParams() { return new URLSearchParams((location.hash.split('?')[1]) || ''); }
  function pageSizeFor(key) { try { return Number(localStorage.getItem('mwas_ps_' + key)) || 20; } catch (e) { return 20; } }
  function savePageSize(key, n) { try { localStorage.setItem('mwas_ps_' + key, String(n)); } catch (e) { /* */ } }
  function pagerHtml(total, page, size) {
    const pages = Math.max(1, Math.ceil(total / size));
    if (total === 0) return '';
    const from = (page - 1) * size + 1, to = Math.min(total, page * size);
    let nums = [];
    const add = n => nums.push('<li class="page-item' + (n === page ? ' active' : '') + '"><button class="page-link" data-page="' + n + '">' + n + '</button></li>');
    const gap = () => nums.push('<li class="page-item disabled"><span class="page-link">…</span></li>');
    for (let n = 1; n <= pages; n++) {
      if (n === 1 || n === pages || Math.abs(n - page) <= 1) add(n);
      else if (nums.length && !/…/.test(nums[nums.length - 1])) gap();
    }
    return '<div class="pager"><span class="small text-muted">' + fmtNum(from) + '–' + fmtNum(to) + ' sur ' + fmtNum(total) + '</span>' +
      '<label class="small text-muted d-flex align-items-center gap-1 ms-auto">Afficher <select class="form-select form-select-sm w-auto" data-size>' +
      [10, 20, 50, 100].map(n => '<option' + (n === size ? ' selected' : '') + '>' + n + '</option>').join('') + '</select> par page</label>' +
      '<ul class="pagination pagination-sm mb-0"><li class="page-item' + (page <= 1 ? ' disabled' : '') + '"><button class="page-link" data-page="' + (page - 1) + '" aria-label="Précédent">‹</button></li>' + nums.join('') +
      '<li class="page-item' + (page >= pages ? ' disabled' : '') + '"><button class="page-link" data-page="' + (page + 1) + '" aria-label="Suivant">›</button></li></ul></div>';
  }
  // Gère page / taille / recherche / filtres d'une liste et la recharge
  function listController(view, key, load) {
    const p = hashParams();
    const st = { page: 1, size: pageSizeFor(key), q: p.get('q') || '', filters: {} };
    st.query = () => {
      const parts = ['limit=' + st.size, 'offset=' + (st.page - 1) * st.size];
      if (st.q) parts.push('q=' + encodeURIComponent(st.q));
      Object.keys(st.filters).forEach(k => { if (st.filters[k] !== '') parts.push(k + '=' + encodeURIComponent(st.filters[k])); });
      return parts.join('&');
    };
    st.reload = (resetPage) => { if (resetPage) st.page = 1; return load(); };
    view.addEventListener('click', e => {
      const b = e.target.closest('.pager [data-page]');
      if (!b || b.closest('.disabled')) return;
      st.page = Number(b.dataset.page); load(); view.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    view.addEventListener('change', e => {
      if (e.target.matches('.pager [data-size]')) { st.size = Number(e.target.value); savePageSize(key, st.size); st.reload(true); }
      if (e.target.matches('[data-f]')) { st.filters[e.target.dataset.f] = e.target.value; st.reload(true); }
    });
    let t;
    view.addEventListener('input', e => {
      if (!e.target.matches('[data-q]')) return;
      clearTimeout(t); t = setTimeout(() => { st.q = e.target.value.trim(); st.reload(true); }, 300);
    });
    return st;
  }
  const searchBox = (st, ph) => '<div class="search-box"><i class="bi bi-search"></i><input class="form-control" type="search" placeholder="' + esc(ph || 'Rechercher…') + '" data-q value="' + esc(st.q) + '"></div>';
  const PUB_FILTER = '<select class="form-select w-auto" data-f="published"><option value="">Tous les statuts</option><option value="true">Publiés</option><option value="false">Brouillons</option></select>';

  /* ---------------- Liste générique ---------------- */
  function crudView(resource, opts) {
    opts = opts || {};
    const def = DEFS[resource];
    return async function (view) {
      let items = [];
      const st = listController(view, resource, load);
      view.innerHTML = (opts.intro || '') + '<div class="toolbar">' + searchBox(st) + PUB_FILTER + (opts.filters || '') +
        '<span class="ms-auto"></span><button class="btn btn-brand" data-new><i class="bi bi-plus-lg me-1"></i>Ajouter</button></div><div data-list></div>';
      async function load() {
        const r = await api('admin?r=' + resource + '&' + st.query());
        items = r.items; draw(r.total);
      }
      function draw(total) {
        const list = $('[data-list]', view);
        if (!items.length) { list.innerHTML = '<div class="panel empty"><i class="bi bi-inbox"></i>' + (st.q || Object.values(st.filters).some(Boolean) ? 'Aucun résultat pour cette recherche.' : 'Aucun élément pour le moment.') + '</div>'; return; }
        list.innerHTML = '<div class="table-wrap table-responsive"><table class="table"><thead><tr><th>Élément</th>' + (def.extraHead || '') + '<th>Statut</th><th class="text-end">Actions</th></tr></thead><tbody>' +
          items.map(i => '<tr data-id="' + i.id + '"><td>' + def.cols(i) + '</td>' + (def.extra ? def.extra(i) : '') +
            '<td>' + (i.published === false ? '<span class="pill pill-off">Brouillon</span>' : '<span class="pill pill-on">Publié</span>') + (i.featured ? ' <span class="pill pill-warn">En avant</span>' : '') + '</td>' +
            '<td><div class="row-actions">' +
            (def.viewUrl && i.published !== false ? '<a class="btn btn-light btn-sm" target="_blank" rel="noopener" href="' + esc(def.viewUrl(i)) + '" title="Voir sur le site"><i class="bi bi-box-arrow-up-right"></i></a>' : '') +
            (can('publish') ? '<button class="btn btn-light btn-sm" data-toggle title="' + (i.published === false ? 'Publier' : 'Dépublier') + '"><i class="bi bi-' + (i.published === false ? 'eye' : 'eye-slash') + '"></i></button>' : '') +
            '<button class="btn btn-light btn-sm" data-edit title="Modifier"><i class="bi bi-pencil"></i></button>' +
            (can('delete') ? '<button class="btn btn-light btn-sm text-danger" data-del title="Supprimer"><i class="bi bi-trash"></i></button>' : '') +
            '</div></td></tr>').join('') + '</tbody></table></div>' + pagerHtml(total, st.page, st.size);
      }
      function edit(item) {
        const fields = def.fields.map(f => f.name === 'published' && !can('publish') ? Object.assign({}, f, { disabled: true, help: 'Vous ne pouvez pas publier : un administrateur validera la publication.' }) : f);
        openEditor((item ? 'Modifier : ' : 'Ajouter : ') + def.title, fields, item, async values => {
          if (item) await api('admin?r=' + resource + '&id=' + item.id, { method: 'PUT', body: values });
          else await api('admin?r=' + resource, { method: 'POST', body: values });
          toast(item ? 'Modifications enregistrées.' : 'Élément ajouté.');
          if (!can('publish') && !item) toast('Enregistré en brouillon : la publication nécessite une autorisation.', 'warn');
          await load(); refreshCounts();
        });
      }
      async function openById(id) { try { const full = await api('admin?r=' + resource + '&id=' + encodeURIComponent(id)); edit(full.item); } catch (err) { toast(err.message, 'error'); } }
      view.addEventListener('click', async e => {
        if (e.target.closest('[data-new]')) return edit(null);
        const tr = e.target.closest('tr[data-id]'); if (!tr) return;
        const item = items.find(i => i.id === tr.dataset.id);
        try {
          if (e.target.closest('[data-edit]')) return openById(item.id);
          if (e.target.closest('[data-toggle]')) { await api('admin?r=' + resource + '&id=' + item.id, { method: 'PUT', body: { published: item.published === false } }); toast(item.published === false ? 'Publié.' : 'Dépublié.'); return load(); }
          if (e.target.closest('[data-del]') && confirmDel('« ' + (item.title || item.name || item.label) + ' »')) { await api('admin?r=' + resource + '&id=' + item.id, { method: 'DELETE' }); toast('Supprimé.'); load(); }
        } catch (err) { toast(err.message, 'error'); }
      });
      await load();
      const open = hashParams().get('open'); if (open) openById(open);
    };
  }

  function csvDownload(name, rows) {
    const csv = rows.map(r => r.map(c => '"' + String(c === null || c === undefined ? '' : c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function fetchAll(resource, extra) {
    let all = [], offset = 0;
    for (;;) {
      const r = await api('admin?r=' + resource + '&limit=500&offset=' + offset + (extra ? '&' + extra : ''));
      all = all.concat(r.items); offset += 500;
      if (all.length >= r.total || !r.items.length) return all;
    }
  }
  function chart(canvas, config) { if (!window.Chart || !canvas) return null; const c = new Chart(canvas, config); S.charts.push(c); return c; }
  function statusPill(s) { return s === 'approved' ? '<span class="pill pill-on">Approuvé</span>' : s === 'pending' ? '<span class="pill pill-warn">En attente</span>' : '<span class="pill pill-off">Masqué</span>'; }
  function donLabel(s) { return ({ success: 'Réussi', pending: 'En attente', failed: 'Échoué', cancelled: 'Annulé' })[s] || s; }
  function donPill(s) { return '<span class="pill ' + ({ success: 'pill-on', pending: 'pill-warn', failed: 'pill-bad', cancelled: 'pill-off' })[s] + '">' + donLabel(s) + '</span>'; }
  const statCard = (icon, value, label, color) => '<div class="col-6 col-xl-3"><div class="stat-card"><div class="stat-icon" style="' + (color ? 'background:' + color + '1a;color:' + color : '') + '"><i class="bi bi-' + icon + '"></i></div><div><div class="stat-value">' + value + '</div><div class="stat-label">' + label + '</div></div></div></div>';

  /* ---------------- Vues ---------------- */
  const VIEWS = {
    async dashboard(view) {
      const d = await api('admin?r=dashboard');
      S.dashboard = d; S.foundedAt = d.founded_at; renderNav('dashboard');
      const c = d.counts, don = d.donations;
      let html = '<div class="panel mb-3 d-flex flex-wrap align-items-center gap-3"><div class="stat-icon"><i class="bi bi-hourglass-split"></i></div><div class="flex-grow-1"><div class="stat-label">Temps d’existence de l’association (depuis le ' + (d.founded_at ? fmtDate(d.founded_at) : '—') + ')</div><div class="existence-big" id="existenceBig">' + existenceText(existence(d.founded_at)) + '</div><div class="cell-sub" id="existenceSecs"></div></div>' + (can('settings') ? '<a href="#settings" class="btn btn-soft btn-sm">Modifier la date</a>' : '') + '</div>';
      html += '<div class="row g-3 mb-3">' +
        statCard('flag', fmtNum(c.realisations), 'Réalisations') + statCard('newspaper', fmtNum(c.articles), 'Actualités') +
        statCard('eye', fmtNum(c.views), 'Vues cumulées', '#2448a8') + statCard('heart', fmtNum(c.likes), "J'aime", '#d63384') +
        statCard('chat-dots', fmtNum(c.comments), 'Commentaires' + (c.pending_comments ? ' (' + c.pending_comments + ' en attente)' : ''), '#6f42c1') +
        statCard('envelope', fmtNum(c.unread_messages), 'Messages non lus', '#fd7e14') + statCard('people', fmtNum(c.team), "Membres de l'équipe", '#20c997') +
        statCard('graph-up-arrow', d.impact.percent + ' %', 'Impact global', '#11743b') + '</div>';
      if (don) {
        const totals = Object.keys(don.total_by_currency).map(k => money(don.total_by_currency[k], k)).join(' + ') || '0 FC';
        html += '<div class="row g-3 mb-3">' + statCard('cash-coin', totals, 'Dons confirmés', '#11743b') + statCard('check2-circle', fmtNum(don.success_count), 'Paiements réussis', '#11743b') +
          statCard('hourglass', fmtNum(don.pending_count), 'Paiements en attente', '#8a5b00') + statCard('x-circle', fmtNum(don.failed_count), 'Paiements échoués', '#a1281b') + '</div>';
      }
      html += '<div class="row g-3"><div class="col-lg-7"><div class="panel h-100"><div class="panel-title"><i class="bi bi-bar-chart text-brand"></i>Impact par indicateur</div><div class="chart-box"><canvas id="chImpact"></canvas></div></div></div>' +
        '<div class="col-lg-5"><div class="panel h-100"><div class="panel-title"><i class="bi bi-pie-chart text-brand"></i>Impact global</div><div class="chart-box"><canvas id="chImpactPct"></canvas></div></div></div>';
      if (don) html += '<div class="col-lg-8"><div class="panel h-100"><div class="panel-title"><i class="bi bi-graph-up text-brand"></i>Dons confirmés (6 derniers mois)</div><div class="chart-box"><canvas id="chDon"></canvas></div></div></div>' +
        '<div class="col-lg-4"><div class="panel h-100"><div class="panel-title"><i class="bi bi-phone text-brand"></i>Réseaux utilisés</div><div class="chart-box"><canvas id="chNet"></canvas></div></div></div>';
      const top = (arr, base) => arr.length ? '<ul class="list-unstyled mb-0">' + arr.map(x => '<li class="d-flex justify-content-between py-2 border-bottom"><a target="_blank" rel="noopener" class="text-decoration-none text-reset" href="' + base + encodeURIComponent(x.slug) + '">' + esc(x.title) + '</a><span class="small text-nowrap ms-2"><i class="bi bi-eye"></i> ' + fmtNum(x.views) + ' · <i class="bi bi-heart"></i> ' + fmtNum(x.likes) + '</span></li>').join('') + '</ul>' : '<p class="text-muted mb-0">Aucune donnée.</p>';
      html += '<div class="col-lg-6"><div class="panel h-100"><div class="panel-title"><i class="bi bi-trophy text-brand"></i>Réalisations les plus vues</div>' + top(d.top.realisations, '/realisation-details.html?realisation=') + '</div></div>' +
        '<div class="col-lg-6"><div class="panel h-100"><div class="panel-title"><i class="bi bi-trophy text-brand"></i>Actualités les plus vues</div>' + top(d.top.articles, '/blog-detail.html?article=') + '</div></div>';
      html += '<div class="col-12"><div class="panel"><div class="panel-title"><i class="bi bi-chat-dots text-brand"></i>Derniers commentaires</div>' +
        (d.recent_comments.length ? d.recent_comments.map(cm => '<div class="py-2 border-bottom"><strong>' + esc(cm.author_name) + '</strong> <span class="cell-sub">· ' + ({ realisation: 'Réalisation', article: 'Actualité', site: "Livre d'or" })[cm.target_type] + ' · ' + fmtDateTime(cm.created_at) + '</span> ' + statusPill(cm.status) + '<div class="small">' + esc(cm.content.slice(0, 180)) + '</div></div>').join('') : '<p class="text-muted mb-0">Aucun commentaire.</p>') +
        (can('comments') ? '<a href="#comments" class="btn btn-soft btn-sm mt-3">Gérer les commentaires</a>' : '') + '</div></div></div>';
      view.innerHTML = html;
      const m = d.impact.metrics;
      chart($('#chImpact'), { type: 'bar', data: { labels: m.map(x => x.label), datasets: [{ label: '% atteint', data: m.map(x => +Math.min(100, Number(x.value) / (Number(x.target) || 1) * 100).toFixed(1)), backgroundColor: m.map(x => x.color || '#A5481D'), borderRadius: 8 }] }, options: { maintainAspectRatio: false, indexAxis: 'y', scales: { x: { min: 0, max: 100, ticks: { callback: v => v + ' %' } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.raw + ' % — ' + fmtNum(m[ctx.dataIndex].value) + ' / ' + fmtNum(m[ctx.dataIndex].target) + ' ' + (m[ctx.dataIndex].unit || '') } } } } });
      chart($('#chImpactPct'), { type: 'doughnut', data: { labels: ['Atteint', 'Restant'], datasets: [{ data: [d.impact.percent, Math.max(0, 100 - d.impact.percent)], backgroundColor: ['#A5481D', '#F1E6DA'], borderWidth: 0 }] }, options: { maintainAspectRatio: false, cutout: '72%', plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => ctx.label + ' : ' + ctx.raw + ' %' } } } }, plugins: [{ id: 'center', afterDraw(ch) { const a = ch.chartArea, ctx = ch.ctx; ctx.save(); ctx.font = '700 26px Sora, sans-serif'; ctx.fillStyle = '#32180F'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.impact.percent + ' %', (a.left + a.right) / 2, (a.top + a.bottom) / 2); ctx.restore(); } }] });
      if (don) {
        const mon = don.months;
        chart($('#chDon'), { type: 'bar', data: { labels: mon.map(x => new Date(x.month + '-01T12:00:00').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })), datasets: [{ label: 'CDF', data: mon.map(x => x.CDF), backgroundColor: '#A5481D', borderRadius: 6, yAxisID: 'y' }, { label: 'USD', data: mon.map(x => x.USD), backgroundColor: '#F2B72C', borderRadius: 6, yAxisID: 'y1' }] }, options: { maintainAspectRatio: false, scales: { y: { position: 'left', title: { display: true, text: 'FC' } }, y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'USD' } } } } });
        chart($('#chNet'), { type: 'doughnut', data: { labels: ['Orange Money', 'M-Pesa', 'Airtel Money'], datasets: [{ data: [don.networks.orange, don.networks.mpesa, don.networks.airtel], backgroundColor: ['#ff7900', '#e60000', '#b5121b'], borderWidth: 0 }] }, options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
      }
    },

    async home(view) {
      const r = await api('admin?r=settings');
      const la = (r.settings && r.settings.latest_activity) || {};
      const fields = [
        { type: 'section', label: 'Section « Dernière activité » de la page d’accueil' },
        { name: 'eyebrow', label: 'Sur-titre', col: 'col-md-4', default: 'Dernière activité' },
        { name: 'title', label: 'Titre', required: true, col: 'col-md-8' },
        { name: 'text', label: 'Texte', type: 'textarea', rows: 4 },
        { name: 'image', label: 'Image', type: 'image', folder: 'home' },
        { name: 'badge_title', label: "Badge sur l'image : titre", col: 'col-md-6' },
        { name: 'badge_date', label: "Badge sur l'image : date", col: 'col-md-6', placeholder: '6 novembre 2026' },
        { name: 'bullets', label: 'Points clés', type: 'pairs', labels: ['Titre en gras', 'Texte'], addLabel: 'Ajouter un point' },
        { name: 'button_label', label: 'Texte du bouton', col: 'col-md-6', default: 'Voir toutes nos activités' },
        { name: 'button_link', label: 'Lien du bouton', col: 'col-md-6', default: 'services.html' }
      ];
      let reals = [];
      if (can('realisations')) { try { reals = (await api('admin?r=realisations')).items; } catch (e) { /* */ } }
      view.innerHTML = '<div class="panel">' + (reals.length ? '<div class="d-flex flex-wrap gap-2 align-items-end mb-3"><div class="flex-grow-1"><label class="form-label fw-semibold small">Remplir à partir d’une réalisation</label><select class="form-select" id="fromReal"><option value="">— Choisir —</option>' + reals.map(x => '<option value="' + x.id + '">' + esc(x.title) + '</option>').join('') + '</select></div><button class="btn btn-soft" id="fillReal" type="button">Remplir</button></div>' : '') +
        '<form id="homeForm"><div id="homeFields"></div><div class="d-flex gap-2 mt-3"><button class="btn btn-brand" type="submit"><i class="bi bi-check2 me-1"></i>Enregistrer et publier sur l’accueil</button><a class="btn btn-light" href="/index.html" target="_blank" rel="noopener">Voir l’accueil</a></div></form></div>';
      const box = $('#homeFields');
      buildForm(box, fields, la);
      const fr = $('#fillReal');
      if (fr) fr.addEventListener('click', async () => {
        const id = $('#fromReal').value; if (!id) return;
        const it = (await api('admin?r=realisations&id=' + id)).item;
        const cur = readForm(box, fields);
        buildForm(box, fields, Object.assign(cur, {
          title: it.title, text: it.summary || it.description || '', image: (it.gallery && it.gallery[0]) || it.image,
          badge_title: it.category || '', badge_date: it.event_date ? new Date(it.event_date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
          bullets: (it.features || []).slice(0, 3), button_label: 'Découvrir cette activité', button_link: 'realisation-details.html?realisation=' + it.slug
        }));
        toast('Champs remplis : vérifiez puis enregistrez.');
      });
      $('#homeForm').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = $('button[type=submit]', e.target);
        try { const v = readForm(box, fields); busy(btn, true); await api('admin?r=settings&key=latest_activity', { method: 'PUT', body: { value: v } }); toast('Accueil mis à jour.'); }
        catch (err) { toast(err.message, 'error'); } finally { busy(btn, false); }
      });
    },

    realisations: crudView('realisations'),
    articles: crudView('articles'),
    gallery: crudView('gallery', { filters: '<select class="form-select w-auto" data-f="category"><option value="">Toutes les catégories</option><option value="sante">Santé et Bien-être</option><option value="droits">Droits</option><option value="formations">Autonomisation</option></select>' }),
    team: crudView('team'),
    partners: crudView('partners'),
    testimonials: crudView('testimonials'),
    impact: crudView('impact_metrics', { intro: '<div class="panel mb-3 small"><i class="bi bi-info-circle text-brand me-1"></i>L’impact global affiché sur le site est la moyenne des pourcentages atteints (valeur ÷ objectif, plafonné à 100 %) de chaque indicateur publié. Il est recalculé automatiquement à chaque modification.</div>' }),

    async comments(view) {
      let items = [];
      const st = listController(view, 'comments', load);
      view.innerHTML = '<div class="toolbar">' + searchBox(st, 'Rechercher un nom ou un texte…') +
        '<select class="form-select w-auto" data-f="status"><option value="">Tous les statuts</option><option value="pending">En attente</option><option value="approved">Approuvés</option><option value="hidden">Masqués</option></select>' +
        '<select class="form-select w-auto" data-f="target_type"><option value="">Tous les contenus</option><option value="realisation">Réalisations</option><option value="article">Actualités</option><option value="site">Livre d’or du site</option></select></div><div data-list></div>';
      async function load() {
        const r = await api('admin?r=comments&' + st.query());
        items = r.items;
        const list = $('[data-list]', view);
        if (!items.length) { list.innerHTML = '<div class="panel empty"><i class="bi bi-chat"></i>Aucun commentaire.</div>'; return; }
        list.innerHTML = items.map(c => {
          const where = c.target_type === 'site' ? "Livre d'or du site" : (c.target ? (c.target_type === 'realisation' ? 'Réalisation : ' : 'Actualité : ') + c.target.title : c.target_type);
          const link = c.target ? (c.target_type === 'realisation' ? '/realisation-details.html?realisation=' : '/blog-detail.html?article=') + encodeURIComponent(c.target.slug) + '#commentaires' : '/index.html#livre-or';
          return '<div class="comment-card' + (c.is_staff ? ' is-staff' : '') + '" data-id="' + c.id + '"><div class="d-flex flex-wrap gap-2 align-items-center"><strong>' + esc(c.author_name) + '</strong>' + (c.is_staff ? '<span class="pill pill-info">Équipe</span>' : '') + statusPill(c.status) + (c.parent_id ? '<span class="pill pill-off">Réponse</span>' : '') +
            '<span class="comment-meta ms-auto">' + fmtDateTime(c.created_at) + ' · <i class="bi bi-heart"></i> ' + c.likes + '</span></div>' +
            '<div class="comment-meta"><a href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(where) + '</a>' + (c.author_email ? ' · <a href="mailto:' + esc(c.author_email) + '">' + esc(c.author_email) + '</a>' : '') + '</div>' +
            '<div class="comment-content">' + esc(c.content) + '</div><div class="d-flex flex-wrap gap-2">' +
            (c.status !== 'approved' ? '<button class="btn btn-sm btn-soft" data-st="approved"><i class="bi bi-check2 me-1"></i>Approuver</button>' : '') +
            (c.status !== 'hidden' ? '<button class="btn btn-sm btn-light" data-st="hidden"><i class="bi bi-eye-slash me-1"></i>Masquer</button>' : '') +
            '<button class="btn btn-sm btn-light" data-reply><i class="bi bi-reply me-1"></i>Répondre</button>' +
            (can('delete') ? '<button class="btn btn-sm btn-light text-danger" data-del><i class="bi bi-trash me-1"></i>Supprimer</button>' : '') + '</div>' +
            '<form class="mt-2" data-reply-form hidden><textarea class="form-control mb-2" rows="3" placeholder="Votre réponse au nom de l’association…" required></textarea><button class="btn btn-brand btn-sm" type="submit">Publier la réponse</button></form></div>';
        }).join('') + pagerHtml(r.total, st.page, st.size);
      }
      view.addEventListener('click', async e => {
        const card = e.target.closest('.comment-card'); if (!card) return;
        const id = card.dataset.id;
        const s = e.target.closest('[data-st]');
        try {
          if (s) { await api('admin?r=comments&id=' + id, { method: 'PUT', body: { status: s.dataset.st } }); toast('Statut mis à jour.'); await load(); refreshCounts(); }
          if (e.target.closest('[data-reply]')) { const f = $('[data-reply-form]', card); f.hidden = !f.hidden; if (!f.hidden) $('textarea', f).focus(); }
          if (e.target.closest('[data-del]') && confirmDel('ce commentaire (et ses réponses)')) { await api('admin?r=comments&id=' + id, { method: 'DELETE' }); toast('Commentaire supprimé.'); await load(); refreshCounts(); }
        } catch (err) { toast(err.message, 'error'); }
      });
      view.addEventListener('submit', async e => {
        const f = e.target.closest('[data-reply-form]'); if (!f) return;
        e.preventDefault();
        const id = f.closest('.comment-card').dataset.id;
        try { await api('admin?r=comment-reply', { body: { parent_id: id, content: $('textarea', f).value } }); toast('Réponse publiée.'); await load(); refreshCounts(); } catch (err) { toast(err.message, 'error'); }
      });
      await load();
    },

    async messages(view) {
      let items = [];
      const st = listController(view, 'messages', load);
      st.filters.archived = 'false';
      view.innerHTML = '<div class="toolbar"><div class="btn-group"><button class="btn btn-soft" data-arch="false">Boîte de réception</button><button class="btn btn-light" data-arch="true">Archives</button></div>' + searchBox(st, 'Nom, e-mail, objet, texte…') +
        '<select class="form-select w-auto" data-f="read"><option value="">Lus et non lus</option><option value="false">Non lus</option><option value="true">Lus</option></select></div><div data-list></div>';
      async function load() {
        const r = await api('admin?r=messages&' + st.query());
        items = r.items;
        const list = $('[data-list]', view);
        if (!items.length) { list.innerHTML = '<div class="panel empty"><i class="bi bi-envelope-open"></i>Aucun message.</div>'; return; }
        const archived = st.filters.archived === 'true';
        list.innerHTML = '<div class="table-wrap table-responsive"><table class="table"><thead><tr><th>Expéditeur</th><th>Message</th><th>Date</th><th class="text-end">Actions</th></tr></thead><tbody>' + items.map(m =>
          '<tr data-id="' + m.id + '" style="cursor:pointer"><td><div class="cell-title">' + (m.read ? '' : '<i class="bi bi-circle-fill text-brand me-1" style="font-size:.5rem"></i>') + esc(m.name) + '</div><div class="cell-sub">' + esc(m.email || '') + ' ' + esc(m.phone || '') + '</div></td><td><div class="' + (m.read ? '' : 'fw-semibold') + '">' + esc(m.subject || '(sans objet)') + '</div><div class="cell-sub">' + esc(m.content.slice(0, 100)) + '</div></td><td class="small text-nowrap">' + fmtDateTime(m.created_at) + '</td><td><div class="row-actions">' +
          '<button class="btn btn-light btn-sm" data-arch-one title="' + (archived ? 'Désarchiver' : 'Archiver') + '"><i class="bi bi-archive"></i></button>' + (can('delete') ? '<button class="btn btn-light btn-sm text-danger" data-del><i class="bi bi-trash"></i></button>' : '') + '</div></td></tr>').join('') + '</tbody></table></div>' + pagerHtml(r.total, st.page, st.size);
      }
      view.addEventListener('click', async e => {
        const tab = e.target.closest('[data-arch]');
        if (tab) { st.filters.archived = tab.dataset.arch; $$('[data-arch]', view).forEach(b => { b.classList.toggle('btn-soft', b === tab); b.classList.toggle('btn-light', b !== tab); }); return st.reload(true); }
        const tr = e.target.closest('tr[data-id]'); if (!tr) return;
        const m = items.find(x => x.id === tr.dataset.id);
        const archived = st.filters.archived === 'true';
        try {
          if (e.target.closest('[data-arch-one]')) { await api('admin?r=messages&id=' + m.id, { method: 'PUT', body: { archived: !archived } }); toast(archived ? 'Message désarchivé.' : 'Message archivé.'); return load(); }
          if (e.target.closest('[data-del]')) { if (confirmDel('ce message')) { await api('admin?r=messages&id=' + m.id, { method: 'DELETE' }); toast('Message supprimé.'); load(); } return; }
          infoModal(m.subject || 'Message de ' + m.name, '<p class="mb-1"><strong>' + esc(m.name) + '</strong></p><p class="small text-muted">' + esc(m.email || '') + ' ' + esc(m.phone || '') + ' · ' + fmtDateTime(m.created_at) + '</p><div class="comment-content">' + esc(m.content) + '</div>' +
            (m.email ? '<a class="btn btn-brand mt-3" href="mailto:' + esc(m.email) + '?subject=' + encodeURIComponent('Re : ' + (m.subject || 'Votre message à Mwinue Asimame')) + '"><i class="bi bi-reply me-1"></i>Répondre par e-mail</a>' : '') +
            (m.phone ? ' <a class="btn btn-soft mt-3" href="https://wa.me/' + esc(String(m.phone).replace(/\D/g, '')) + '" target="_blank" rel="noopener"><i class="bi bi-whatsapp me-1"></i>WhatsApp</a>' : ''));
          if (!m.read) { await api('admin?r=messages&id=' + m.id, { method: 'PUT', body: { read: true } }); refreshCounts(); load(); }
        } catch (err) { toast(err.message, 'error'); }
      });
      await load();
    },

    async subscribers(view) {
      let items = [];
      const st = listController(view, 'subscribers', load);
      view.innerHTML = '<div class="toolbar">' + searchBox(st, 'Rechercher un e-mail…') + '<select class="form-select w-auto" data-f="active"><option value="">Tous</option><option value="true">Actifs</option><option value="false">Désinscrits</option></select><span class="ms-auto"></span><button class="btn btn-light" data-export><i class="bi bi-download me-1"></i>Exporter (CSV)</button><button class="btn btn-brand" data-new><i class="bi bi-plus-lg me-1"></i>Ajouter</button></div><div data-list></div>';
      async function load() {
        const r = await api('admin?r=subscribers&' + st.query());
        items = r.items;
        $('[data-list]', view).innerHTML = items.length ? '<div class="table-wrap table-responsive"><table class="table"><thead><tr><th>E-mail</th><th>Inscription</th><th>Statut</th><th class="text-end">Actions</th></tr></thead><tbody>' + items.map(s => '<tr data-id="' + s.id + '"><td><a href="mailto:' + esc(s.email) + '">' + esc(s.email) + '</a></td><td class="small">' + fmtDateTime(s.created_at) + '</td><td>' + (s.active ? '<span class="pill pill-on">Actif</span>' : '<span class="pill pill-off">Désinscrit</span>') + '</td><td><div class="row-actions"><button class="btn btn-light btn-sm" data-toggle>' + (s.active ? 'Désactiver' : 'Réactiver') + '</button>' + (can('delete') ? '<button class="btn btn-light btn-sm text-danger" data-del><i class="bi bi-trash"></i></button>' : '') + '</div></td></tr>').join('') + '</tbody></table></div>' + pagerHtml(r.total, st.page, st.size) : '<div class="panel empty"><i class="bi bi-send"></i>Aucun abonné.</div>';
      }
      view.addEventListener('click', async e => {
        try {
          if (e.target.closest('[data-export]')) { const all = await fetchAll('subscribers'); return csvDownload('abonnes-mwas.csv', [['E-mail', 'Actif', 'Inscription']].concat(all.map(s => [s.email, s.active ? 'oui' : 'non', s.created_at]))); }
          if (e.target.closest('[data-new]')) { const em = prompt('Adresse e-mail à ajouter'); if (em) { await api('admin?r=subscribers', { body: { email: em.trim(), active: true } }); toast('Abonné ajouté.'); load(); } return; }
          const tr = e.target.closest('tr[data-id]'); if (!tr) return;
          const s = items.find(x => x.id === tr.dataset.id);
          if (e.target.closest('[data-toggle]')) { await api('admin?r=subscribers&id=' + s.id, { method: 'PUT', body: { active: !s.active } }); load(); }
          if (e.target.closest('[data-del]') && confirmDel(s.email)) { await api('admin?r=subscribers&id=' + s.id, { method: 'DELETE' }); load(); }
        } catch (err) { toast(err.message, 'error'); }
      });
      await load();
    },

    async donations(view) {
      let items = [];
      const st = listController(view, 'donations', load);
      view.innerHTML = '<div id="donStats" class="row g-3 mb-3"></div><div class="toolbar">' + searchBox(st, 'Référence, nom, téléphone…') +
        '<select class="form-select w-auto" data-f="status"><option value="">Tous les statuts</option><option value="success">Réussis</option><option value="pending">En attente</option><option value="failed">Échoués</option><option value="cancelled">Annulés</option></select>' +
        '<select class="form-select w-auto" data-f="network"><option value="">Tous les réseaux</option><option value="orange">Orange Money</option><option value="mpesa">M-Pesa</option><option value="airtel">Airtel Money</option></select>' +
        '<select class="form-select w-auto" data-f="currency"><option value="">Toutes devises</option><option value="CDF">CDF</option><option value="USD">USD</option></select>' +
        '<span class="ms-auto"></span><button class="btn btn-light" data-export><i class="bi bi-download me-1"></i>Exporter (CSV)</button></div><div data-list></div>';
      try { S.dashboard = await api('admin?r=dashboard'); } catch (e) { /* */ }
      const d = S.dashboard && S.dashboard.donations;
      if (d) {
        const totals = Object.keys(d.total_by_currency).map(k => money(d.total_by_currency[k], k)).join(' + ') || '0 FC';
        $('#donStats').innerHTML = statCard('cash-coin', totals, 'Total des dons confirmés', '#11743b') + statCard('check2-circle', fmtNum(d.success_count), 'Réussis', '#11743b') + statCard('hourglass', fmtNum(d.pending_count), 'En attente', '#8a5b00') + statCard('calendar-check', fmtNum(d.this_month), 'Dons ce mois-ci');
      }
      async function load() {
        const r = await api('admin?r=donations&' + st.query());
        items = r.items;
        $('[data-list]', view).innerHTML = items.length ? '<div class="table-wrap table-responsive"><table class="table"><thead><tr><th>Date</th><th>Donateur</th><th>Montant</th><th>Réseau</th><th>Référence</th><th>Statut</th><th class="text-end">Actions</th></tr></thead><tbody>' + items.map(x =>
          '<tr data-id="' + x.id + '"><td class="small text-nowrap">' + fmtDateTime(x.created_at) + '</td><td><div class="cell-title">' + (x.anonymous ? '<i class="bi bi-incognito me-1"></i>Anonyme' : esc(x.donor_name || '—')) + '</div><div class="cell-sub">' + esc(x.phone) + '</div></td><td class="fw-semibold text-nowrap">' + money(x.amount, x.currency) + '</td><td>' + esc(NETWORKS[x.network] || x.network) + '</td><td class="small"><code>' + esc(x.reference) + '</code></td><td>' + donPill(x.status) + '</td>' +
          '<td><div class="row-actions"><button class="btn btn-light btn-sm" data-detail title="Détails"><i class="bi bi-info-circle"></i></button>' + (x.status === 'pending' ? '<button class="btn btn-light btn-sm" data-check title="Vérifier auprès de l’opérateur"><i class="bi bi-arrow-repeat"></i></button>' : '') + '</div></td></tr>').join('') + '</tbody></table></div>' + pagerHtml(r.total, st.page, st.size) : '<div class="panel empty"><i class="bi bi-cash-coin"></i>Aucun don trouvé.</div>';
      }
      view.addEventListener('click', async e => {
        if (e.target.closest('[data-export]')) {
          const extra = Object.keys(st.filters).filter(k => st.filters[k]).map(k => k + '=' + encodeURIComponent(st.filters[k])).concat(st.q ? ['q=' + encodeURIComponent(st.q)] : []).join('&');
          const all = await fetchAll('donations', extra);
          return csvDownload('dons-mwas.csv', [['Date', 'Référence', 'Donateur', 'Anonyme', 'Téléphone', 'Réseau', 'Montant', 'Devise', 'Affectation', 'Statut', 'Réf. opérateur', 'Message']].concat(all.map(x => [x.created_at, x.reference, x.donor_name, x.anonymous ? 'oui' : 'non', x.phone, NETWORKS[x.network], x.amount, x.currency, x.purpose, x.status, x.provider_reference, x.provider_message])));
        }
        const tr = e.target.closest('tr[data-id]'); if (!tr) return;
        const x = items.find(i => i.id === tr.dataset.id);
        if (e.target.closest('[data-check]')) {
          try { const r = await api('admin?r=donation-check&id=' + x.id, { body: {} }); toast('Statut : ' + donLabel(r.item.status)); load(); } catch (err) { toast(err.message, 'error'); }
          return;
        }
        if (e.target.closest('[data-detail]')) {
          infoModal('Don ' + x.reference, '<dl class="row mb-0">' + [['Montant', money(x.amount, x.currency)], ['Statut', donPill(x.status)], ['Réseau', NETWORKS[x.network]], ['Téléphone', x.phone], ['Donateur', x.anonymous ? 'Anonyme' : (x.donor_name || '—')], ['E-mail', x.donor_email || '—'], ['Affectation', x.purpose || '—'], ['N° commande FlexPay', x.provider_order || '—'], ['Réf. opérateur', x.provider_reference || '—'], ['Message', x.provider_message || '—'], ['Créé le', fmtDateTime(x.created_at)], ['Mis à jour', fmtDateTime(x.updated_at)]]
            .map(r => '<dt class="col-sm-4">' + r[0] + '</dt><dd class="col-sm-8">' + (r[0] === 'Statut' ? r[1] : esc(r[1])) + '</dd>').join('') + '</dl>' +
            (S.user.role === 'admin' ? '<div class="mt-3 d-flex gap-2 flex-wrap"><span class="small text-muted w-100">Correction manuelle du statut (paiement confirmé hors ligne, par exemple) :</span>' + ['success', 'failed', 'cancelled'].map(s => '<button class="btn btn-sm btn-light" data-manual="' + s + '" data-id="' + x.id + '">' + donLabel(s) + '</button>').join('') + '</div>' : ''));
        }
      });
      $('#infoBody').onclick = async e => {
        const b = e.target.closest('[data-manual]'); if (!b) return;
        if (!confirm('Changer manuellement le statut en « ' + donLabel(b.dataset.manual) + ' » ?')) return;
        try { await api('admin?r=donations&id=' + b.dataset.id, { method: 'PUT', body: { status: b.dataset.manual, provider_message: 'Statut modifié manuellement par ' + S.user.name } }); toast('Statut modifié.'); bootstrap.Modal.getInstance($('#infoModal')).hide(); load(); } catch (err) { toast(err.message, 'error'); }
      };
      await load();
    },

    async media(view) {
      let files = [];
      const st = { page: 1, size: pageSizeFor('media'), q: hashParams().get('q') || '', folder: '' };
      view.innerHTML = '<div class="toolbar">' + searchBox(st, 'Rechercher un fichier…') + '<select class="form-select w-auto" data-folder-filter><option value="">Tous les dossiers</option><option value="realisations">Réalisations</option><option value="articles">Actualités</option><option value="gallery">Galerie</option><option value="team">Équipe</option><option value="partners">Partenaires</option><option value="home">Accueil</option><option value="divers">Divers</option></select>' +
        '<span class="ms-auto"></span><select class="form-select w-auto" id="mediaFolder" title="Dossier de destination"><option value="divers">Envoyer dans : divers</option><option value="realisations">réalisations</option><option value="articles">actualités</option><option value="gallery">galerie</option><option value="team">équipe</option><option value="partners">partenaires</option><option value="home">accueil</option></select><button class="btn btn-brand" data-up><i class="bi bi-upload me-1"></i>Téléverser</button></div><div class="upload-progress mb-3" hidden><span></span></div><div data-list></div>';
      function draw() {
        const q = st.q.toLowerCase();
        const list = files.filter(f => (!st.folder || f.path.startsWith(st.folder + '/')) && (!q || f.path.toLowerCase().includes(q)));
        const pages = Math.max(1, Math.ceil(list.length / st.size)); st.page = Math.min(st.page, pages);
        const slice = list.slice((st.page - 1) * st.size, st.page * st.size);
        $('[data-list]', view).innerHTML = list.length ? '<div class="media-grid">' + slice.map(f => '<div class="media-item" data-path="' + esc(f.path) + '" data-url="' + esc(f.url) + '">' + (/\.mp4$/i.test(f.path) ? '<video src="' + esc(f.url) + '" muted></video>' : '<img src="' + esc(f.url) + '" alt="" loading="lazy">') + '<div class="media-info"><span title="' + esc(f.path) + '">' + esc(f.path.split('/').pop()) + '</span><button class="btn btn-light btn-sm py-0 px-1" data-copy title="Copier l’URL"><i class="bi bi-clipboard"></i></button>' + (can('delete') ? '<button class="btn btn-light btn-sm py-0 px-1 text-danger" data-del title="Supprimer"><i class="bi bi-trash"></i></button>' : '') + '</div></div>').join('') + '</div>' + pagerHtml(list.length, st.page, st.size) : '<div class="panel empty"><i class="bi bi-folder2-open"></i>' + (files.length ? 'Aucun fichier ne correspond.' : 'Aucun fichier téléversé. Les images d’origine du site restent dans le dossier img/.') + '</div>';
      }
      async function load() { files = (await api('admin?r=media')).files; draw(); }
      let t;
      view.addEventListener('input', e => { if (e.target.matches('[data-q]')) { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value.trim(); st.page = 1; draw(); }, 200); } });
      view.addEventListener('change', e => {
        if (e.target.matches('[data-folder-filter]')) { st.folder = e.target.value; st.page = 1; draw(); }
        if (e.target.matches('.pager [data-size]')) { st.size = Number(e.target.value); savePageSize('media', st.size); st.page = 1; draw(); }
      });
      view.addEventListener('click', async e => {
        const pb = e.target.closest('.pager [data-page]');
        if (pb && !pb.closest('.disabled')) { st.page = Number(pb.dataset.page); return draw(); }
        if (e.target.closest('[data-up]')) {
          const picked = await pickFiles('image/*,video/mp4', true); if (!picked.length) return;
          const bar = $('.upload-progress', view); bar.hidden = false;
          for (let i = 0; i < picked.length; i++) {
            try { await uploadFile(picked[i], $('#mediaFolder').value, p => { $('span', bar).style.width = Math.round(((i + p) / picked.length) * 100) + '%'; }); } catch (err) { toast(err.message, 'error'); }
          }
          bar.hidden = true; toast('Téléversement terminé.'); return load();
        }
        const it = e.target.closest('.media-item'); if (!it) return;
        if (e.target.closest('[data-copy]')) { try { await navigator.clipboard.writeText(it.dataset.url); toast('URL copiée.'); } catch (err) { prompt('URL :', it.dataset.url); } }
        if (e.target.closest('[data-del]') && confirmDel('ce fichier')) { try { await api('admin?r=media&path=' + encodeURIComponent(it.dataset.path), { method: 'DELETE' }); toast('Fichier supprimé.'); load(); } catch (err) { toast(err.message, 'error'); } }
      });
      await load();
    },

    async settings(view) {
      const r = await api('admin?r=settings');
      const contact = r.settings.contact || {}, general = r.settings.general || {};
      const cFields = [
        { type: 'section', label: 'Identité' },
        { name: 'association_name', label: "Nom de l'association", col: 'col-md-6' },
        { name: 'tagline', label: 'Devise', col: 'col-md-6' },
        { type: 'section', label: 'Coordonnées affichées sur le site' },
        { name: 'email', label: 'Adresse e-mail', type: 'email', col: 'col-md-6' },
        { name: 'phones', label: 'Numéros de téléphone', type: 'list', long: false, labels: ['+243 …'], addLabel: 'Ajouter un numéro', col: 'col-md-6' },
        { name: 'address', label: 'Adresse physique', col: 'col-md-6', placeholder: 'Avenue, numéro, quartier, commune, ville' },
        { name: 'address_detail', label: "Complément d'adresse", col: 'col-md-6' },
        { name: 'city', label: 'Ville', col: 'col-md-4' },
        { name: 'map_query', label: 'Recherche pour la carte Google Maps', col: 'col-md-8', help: 'Ex. « Kolwezi, Lualaba, RDC » ou des coordonnées GPS « -10.71,25.47 ».' },
        { name: 'hours', label: "Horaires d'ouverture", placeholder: 'Lundi – vendredi : 8 h – 16 h' },
        { type: 'section', label: 'Réseaux sociaux' },
        { name: 'whatsapp', label: 'WhatsApp (numéro)', col: 'col-md-4', placeholder: '+243…' },
        { name: 'facebook', label: 'Facebook (lien)', col: 'col-md-4' },
        { name: 'instagram', label: 'Instagram (lien)', col: 'col-md-4' },
        { name: 'tiktok', label: 'TikTok (lien)', col: 'col-md-4' },
        { name: 'linkedin', label: 'LinkedIn (lien)', col: 'col-md-4' },
        { name: 'youtube', label: 'YouTube (lien)', col: 'col-md-4' }
      ];
      const gFields = [
        { name: 'founded_at', label: "Date de création de l'association", type: 'datetime', col: 'col-md-6', help: 'Sert au compteur « temps d’existence » qui s’incrémente automatiquement sur le site.' },
        { name: 'hero_rating', label: "Note affichée dans l'en-tête de l'accueil", col: 'col-md-6', placeholder: '4.9/5' },
        { name: 'comments_moderation', label: 'Valider les commentaires avant publication', type: 'bool', col: 'col-md-6' },
        { name: 'auto_lock_minutes', label: 'Verrouillage automatique (minutes d’inactivité)', type: 'number', step: 1, col: 'col-md-6', default: 5 },
        { type: 'section', label: 'Dons' },
        { name: 'donation_amounts', label: 'Montants suggérés (FC)', type: 'tags', col: 'col-md-6', help: 'Séparés par des virgules, ex. 10000, 25000, 50000' },
        { name: 'donation_min_cdf', label: 'Don minimum (FC)', type: 'number', step: 1, col: 'col-md-3', default: 1000 },
        { name: 'donation_min_usd', label: 'Don minimum (USD)', type: 'number', step: 1, col: 'col-md-3', default: 1 }
      ];
      view.innerHTML = '<div class="row g-3"><div class="col-xl-7"><form class="panel" id="cForm"><div class="panel-title"><i class="bi bi-geo-alt text-brand"></i>Coordonnées de l’association</div><div id="cBox"></div><button class="btn btn-brand mt-2" type="submit">Enregistrer les coordonnées</button></form></div>' +
        '<div class="col-xl-5"><form class="panel" id="gForm"><div class="panel-title"><i class="bi bi-sliders text-brand"></i>Paramètres généraux</div><div id="gBox"></div><button class="btn btn-brand mt-2" type="submit">Enregistrer les paramètres</button></form>' +
        '<div class="panel"><div class="panel-title"><i class="bi bi-phone text-brand"></i>Paiement Mobile Money</div><p class="small mb-2">Les dons passent par l’agrégateur congolais <strong>FlexPay</strong> (Orange Money, M-Pesa, Airtel Money). Les identifiants se configurent dans les variables d’environnement Vercel : <code>FLEXPAY_TOKEN</code> et <code>FLEXPAY_MERCHANT</code>.</p><p class="small mb-0" id="payState">Vérification…</p></div></div></div>';
      const cBox = $('#cBox'), gBox = $('#gBox');
      buildForm(cBox, cFields, contact);
      buildForm(gBox, gFields, general);
      fetch('/api/donate?config').then(x => x.json()).then(c => { $('#payState').innerHTML = c.enabled ? '<span class="pill pill-on">Activé</span> Les donateurs peuvent payer en ligne.' : '<span class="pill pill-warn">Non configuré</span> Ajoutez les identifiants FlexPay sur Vercel puis redéployez.'; }).catch(() => { $('#payState').textContent = ''; });
      async function save(form, key, box, fields, base) {
        const btn = $('button[type=submit]', form);
        try {
          const v = Object.assign({}, base, readForm(box, fields));
          if (key === 'general') v.donation_amounts = (v.donation_amounts || []).map(Number).filter(n => n > 0);
          busy(btn, true);
          await api('admin?r=settings&key=' + key, { method: 'PUT', body: { value: v } });
          if (key === 'general') { S.foundedAt = v.founded_at; S.autoLock = Number(v.auto_lock_minutes) || 5; resetIdle(); }
          toast('Paramètres enregistrés.');
        } catch (err) { toast(err.message, 'error'); } finally { busy(btn, false); }
      }
      $('#cForm').addEventListener('submit', e => { e.preventDefault(); save(e.target, 'contact', cBox, cFields, contact); });
      $('#gForm').addEventListener('submit', e => { e.preventDefault(); save(e.target, 'general', gBox, gFields, general); });
    },

    async users(view) {
      let data = await api('admin?r=users');
      const permList = data.permissions;
      function draw() {
        view.innerHTML = '<div class="toolbar"><p class="mb-0 small text-muted">Les <strong>communicateurs</strong> n’accèdent qu’aux sections que vous cochez. Sans l’autorisation « Publier », leurs contenus restent en brouillon jusqu’à votre validation.</p><span class="ms-auto"></span><button class="btn btn-brand" data-new><i class="bi bi-person-plus me-1"></i>Ajouter un utilisateur</button></div>' +
          '<div class="table-wrap table-responsive"><table class="table"><thead><tr><th>Utilisateur</th><th>Rôle</th><th>Autorisations</th><th>Dernière connexion</th><th>Statut</th><th class="text-end">Actions</th></tr></thead><tbody>' + data.items.map(u =>
            '<tr data-id="' + u.id + '"><td><div class="d-flex align-items-center gap-2"><span class="user-avatar">' + initials(u.name) + '</span><div><div class="cell-title">' + esc(u.name) + (u.id === S.user.id ? ' <span class="pill pill-info">Vous</span>' : '') + '</div><div class="cell-sub">' + esc(u.email) + '</div></div></div></td>' +
            '<td>' + (u.role === 'admin' ? '<span class="pill pill-warn">Administrateur</span>' : '<span class="pill pill-info">Communicateur</span>') + '</td>' +
            '<td class="small" style="max-width:320px">' + (u.role === 'admin' ? 'Tous les droits' : ((u.permissions || []).map(p => permList[p]).filter(Boolean).join(', ') || '<span class="text-muted">Aucune</span>')) + '</td>' +
            '<td class="small text-nowrap">' + fmtDateTime(u.last_login_at) + '</td><td>' + (u.active ? '<span class="pill pill-on">Actif</span>' : '<span class="pill pill-bad">Désactivé</span>') + (u.has_pin ? '' : ' <span class="pill pill-off">Sans PIN</span>') + '</td>' +
            '<td><div class="row-actions"><button class="btn btn-light btn-sm" data-edit><i class="bi bi-pencil"></i></button>' + (u.id !== S.user.id ? '<button class="btn btn-light btn-sm text-danger" data-del><i class="bi bi-trash"></i></button>' : '') + '</div></td></tr>').join('') + '</tbody></table></div>';
      }
      function editUser(u) {
        const fields = [
          { name: 'name', label: 'Nom complet', required: true, col: 'col-md-6' },
          { name: 'email', label: 'E-mail (identifiant)', type: 'email', required: true, col: 'col-md-6' },
          { name: 'role', label: 'Rôle', type: 'select', options: [['communicator', 'Communicateur (droits limités)'], ['admin', 'Administrateur (tous les droits)']], col: 'col-md-6' },
          { name: 'active', label: 'Compte actif', type: 'bool', default: true, col: 'col-md-6' },
          { name: 'password', label: u ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe provisoire', type: 'password', required: !u, col: 'col-md-6', help: '8 caractères minimum. Communiquez-le à la personne de façon sûre.' }
        ];
        if (u) fields.push({ name: 'reset_pin', label: 'Réinitialiser le code PIN (nouveau code à la prochaine connexion)', type: 'bool', col: 'col-md-6' });
        else fields.push({ name: 'pin', label: 'Code PIN (facultatif)', type: 'password', col: 'col-md-6', help: "Sinon, l'utilisateur le choisira à sa première connexion." });
        openEditor(u ? 'Modifier ' + u.name : 'Nouvel utilisateur', fields, u ? Object.assign({}, u, { password: '' }) : { active: true, role: 'communicator' }, async v => {
          v.permissions = $$('#editBody [data-perm]:checked').map(c => c.value);
          if (u) { if (!v.password) delete v.password; await api('admin?r=users&id=' + u.id, { method: 'PUT', body: v }); }
          else await api('admin?r=users', { method: 'POST', body: v });
          toast('Utilisateur enregistré.');
          data = await api('admin?r=users'); draw();
        });
        const perms = (u && u.permissions) || ['realisations', 'articles', 'gallery', 'comments', 'media'];
        $('#editBody .row').insertAdjacentHTML('beforeend', '<div class="col-12" id="permBox"><div class="section-sep">Autorisations du communicateur</div><div class="perm-grid">' +
          Object.keys(permList).map(p => '<div class="form-check"><input class="form-check-input" type="checkbox" data-perm value="' + p + '" id="p_' + p + '"' + (perms.includes(p) ? ' checked' : '') + '><label class="form-check-label small" for="p_' + p + '">' + esc(permList[p]) + '</label></div>').join('') + '</div></div>');
        const roleSel = $('#editBody [name=role]');
        const sync = () => { $('#permBox').hidden = roleSel.value === 'admin'; };
        roleSel.addEventListener('change', sync); sync();
      }
      view.addEventListener('click', async e => {
        if (e.target.closest('[data-new]')) return editUser(null);
        const tr = e.target.closest('tr[data-id]'); if (!tr) return;
        const u = data.items.find(x => x.id === tr.dataset.id);
        if (e.target.closest('[data-edit]')) editUser(u);
        if (e.target.closest('[data-del]') && confirmDel('le compte de ' + u.name)) { try { await api('admin?r=users&id=' + u.id, { method: 'DELETE' }); toast('Utilisateur supprimé.'); data = await api('admin?r=users'); draw(); } catch (err) { toast(err.message, 'error'); } }
      });
      draw();
    },

    async audit(view) {
      const L = { login: 'Connexion', login_failed: 'Échec de connexion', first_setup: 'Première connexion sécurisée', create: 'Création', update: 'Modification', delete: 'Suppression', reply: 'Réponse', recheck: 'Vérification paiement', pin_changed: 'PIN modifié', password_changed: 'Mot de passe modifié', logout_all: 'Déconnexion partout', pin_locked_out: 'PIN bloqué (trop d’essais)', donation_callback: 'Notification de paiement' };
      const st = listController(view, 'audit', load);
      view.innerHTML = '<div class="toolbar">' + searchBox(st, 'Utilisateur, action, élément…') + '<select class="form-select w-auto" data-f="action"><option value="">Toutes les actions</option>' + Object.keys(L).map(k => '<option value="' + k + '">' + L[k] + '</option>').join('') + '</select></div><div data-list></div>';
      async function load() {
        const r = await api('admin?r=audit_log&' + st.query());
        $('[data-list]', view).innerHTML = r.items.length ? '<div class="table-wrap table-responsive"><table class="table"><thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Élément</th></tr></thead><tbody>' + r.items.map(a => '<tr><td class="small text-nowrap">' + fmtDateTime(a.created_at) + '</td><td>' + esc(a.user_name || (a.details && a.details.email) || '—') + '</td><td>' + esc(L[a.action] || a.action) + '</td><td class="small">' + esc(a.entity || '') + (a.details && a.details.title ? ' · ' + esc(a.details.title) : '') + (a.details && a.details.status ? ' · ' + esc(a.details.status) : '') + '</td></tr>').join('') + '</tbody></table></div>' + pagerHtml(r.total, st.page, st.size) : '<div class="panel empty"><i class="bi bi-clock-history"></i>Aucune activité.</div>';
      }
      await load();
    },

    async account(view) {
      view.innerHTML = '<div class="row g-3"><div class="col-lg-6"><form class="panel" id="profForm"><div class="panel-title"><i class="bi bi-person text-brand"></i>Profil</div><div class="field"><label class="form-label">Nom</label><input class="form-control" name="name" value="' + esc(S.user.name) + '" required></div><div class="field"><label class="form-label">E-mail</label><input class="form-control" value="' + esc(S.user.email) + '" disabled></div><p class="small text-muted">Rôle : ' + (S.user.role === 'admin' ? 'Administrateur' : 'Communicateur') + '</p><button class="btn btn-brand" type="submit">Enregistrer</button></form>' +
        '<form class="panel" id="pinForm"><div class="panel-title"><i class="bi bi-shield-lock text-brand"></i>Code PIN de verrouillage</div><div class="row g-2"><div class="col-md-6 field"><label class="form-label">Nouveau PIN (4 à 6 chiffres)</label><input class="form-control pin-input" name="pin" type="password" inputmode="numeric" pattern="\\d{4,6}" maxlength="6" required></div><div class="col-md-6 field"><label class="form-label">Mot de passe actuel</label><input class="form-control" name="password" type="password" required autocomplete="current-password"></div></div><button class="btn btn-brand" type="submit">Changer le PIN</button></form></div>' +
        '<div class="col-lg-6"><form class="panel" id="pwdForm"><div class="panel-title"><i class="bi bi-key text-brand"></i>Mot de passe</div><div class="field"><label class="form-label">Mot de passe actuel</label><input class="form-control" name="current" type="password" required autocomplete="current-password"></div><div class="field"><label class="form-label">Nouveau mot de passe</label><input class="form-control" name="password" type="password" minlength="8" required autocomplete="new-password"></div><div class="field"><label class="form-label">Confirmer</label><input class="form-control" name="password2" type="password" minlength="8" required autocomplete="new-password"></div><button class="btn btn-brand" type="submit">Changer le mot de passe</button></form>' +
        '<div class="panel"><div class="panel-title"><i class="bi bi-phone-vibrate text-brand"></i>Sécurité des sessions</div><p class="small">Le verrouillage automatique s’active après ' + S.autoLock + ' minute(s) d’inactivité. Raccourci : <kbd>Ctrl</kbd> + <kbd>Maj</kbd> + <kbd>L</kbd>.</p><button class="btn btn-outline-danger" id="logoutAll"><i class="bi bi-door-closed me-1"></i>Déconnecter tous mes appareils</button></div></div></div>';
      $('#profForm').addEventListener('submit', async e => { e.preventDefault(); try { const r = await api('auth?a=profile', { body: { name: e.target.name.value } }); S.user = Object.assign(S.user, r.user); store.user = S.user; $('#userName').textContent = S.user.name; $('#userAvatar').textContent = initials(S.user.name); toast('Profil mis à jour.'); } catch (err) { toast(err.message, 'error'); } });
      $('#pinForm').addEventListener('submit', async e => { e.preventDefault(); const f = e.target; try { await api('auth?a=set-pin', { body: { pin: f.pin.value, password: f.password.value } }); store.pinLen = f.pin.value.length; f.reset(); toast('Code PIN modifié.'); } catch (err) { toast(err.message, 'error'); } });
      $('#pwdForm').addEventListener('submit', async e => {
        e.preventDefault(); const f = e.target;
        if (f.password.value !== f.password2.value) return toast('Les mots de passe ne correspondent pas.', 'error');
        try { const r = await api('auth?a=change-password', { body: { current: f.current.value, password: f.password.value } }); store.session = r.session; store.ticket = r.ticket; f.reset(); toast('Mot de passe modifié. Vos autres appareils ont été déconnectés.'); } catch (err) { toast(err.message, 'error'); }
      });
      $('#logoutAll').addEventListener('click', async () => { if (!confirm('Déconnecter toutes vos sessions, y compris celle-ci ?')) return; try { await api('auth?a=logout-all', { body: {} }); logout(false); } catch (err) { toast(err.message, 'error'); } });
    }
  };

  boot();
})();
