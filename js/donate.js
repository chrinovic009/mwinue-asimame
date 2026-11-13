/* MWAS — Don par Mobile Money (Orange Money, M-Pesa, Airtel Money) via FlexPay */
(function () {
  'use strict';
  var M = window.MWAS;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('donationForm'), amountInput = $('donationAmount'), amountError = $('amountError'), networkError = $('networkError');
  var donorName = $('donorName'), donorNameField = $('donorNameField');
  var cfg = { enabled: true, min_cdf: 1000, min_usd: 1, amounts: [10000, 25000, 50000, 100000], prefixes: { mpesa: ['81', '82', '83'], airtel: ['97', '98', '99'], orange: ['80', '84', '85', '89'] } };
  var currency = 'CDF', selectedAmount = 0, selectedNetwork = '', pollTimer = null, pollCount = 0;
  var NAMES = { airtel: 'Airtel Money', mpesa: 'M-Pesa', orange: 'Orange Money' };

  function fmt(a, c) { return new Intl.NumberFormat('fr-FR').format(a) + ((c || currency) === 'USD' ? ' $' : ' FC'); }
  function min() { return currency === 'USD' ? cfg.min_usd : cfg.min_cdf; }
  function showStep(n) {
    document.querySelectorAll('[data-donation-step]').forEach(function (s) { s.hidden = Number(s.dataset.donationStep) !== n; });
    document.querySelectorAll('[data-step-indicator]').forEach(function (i) {
      var k = Number(i.dataset.stepIndicator);
      i.classList.toggle('is-current', k === n); i.classList.toggle('is-complete', k < n);
    });
    $('donationStatus').textContent = 'Étape ' + n + ' sur 3.';
    window.scrollTo({ top: document.querySelector('.donate-card').offsetTop - 90, behavior: 'smooth' });
  }
  function renderAmounts() {
    var box = document.querySelector('.donate-amount-options');
    var list = currency === 'USD' ? [5, 10, 25, 50] : cfg.amounts;
    box.innerHTML = list.map(function (a) { return '<button type="button" class="donate-amount-option" data-amount="' + a + '">' + fmt(a) + '</button>'; }).join('');
    $('currencySymbol').textContent = currency === 'USD' ? '$' : 'FC';
    $('amountHelp').textContent = 'Montant libre, à partir de ' + fmt(min()) + '.';
    amountInput.min = String(min());
    amountInput.step = currency === 'USD' ? '0.01' : '1';
  }

  fetch('/api/donate?config').then(function (r) { return r.json(); }).then(function (c) {
    if (c && c.min_cdf) cfg = Object.assign(cfg, c);
    renderAmounts();
    if (c && c.enabled === false) {
      var n = document.querySelector('.donate-form-note');
      if (n) n.innerHTML = '<i class="bi bi-info-circle" aria-hidden="true"></i> Le paiement en ligne est en cours d’activation. Vous pouvez déjà nous contacter pour faire un don.';
    }
  }).catch(renderAmounts);

  document.querySelectorAll('[data-currency]').forEach(function (b) {
    b.addEventListener('click', function () {
      currency = b.dataset.currency;
      document.querySelectorAll('[data-currency]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
      amountInput.value = ''; renderAmounts();
    });
  });
  document.querySelectorAll('input[name="donorVisibility"]').forEach(function (input) {
    input.addEventListener('change', function () {
      if (!input.checked) return;
      var named = input.value === 'named';
      donorNameField.hidden = !named; donorName.required = named;
      if (!named) donorName.value = '';
    });
  });
  document.querySelector('.donate-amount-options').addEventListener('click', function (e) {
    var b = e.target.closest('[data-amount]'); if (!b) return;
    amountInput.value = b.dataset.amount; amountError.hidden = true;
    document.querySelectorAll('[data-amount]').forEach(function (o) { o.classList.toggle('is-selected', o === b); });
  });
  amountInput.addEventListener('input', function () {
    document.querySelectorAll('[data-amount]').forEach(function (b) { b.classList.toggle('is-selected', b.dataset.amount === amountInput.value); });
    if (Number(amountInput.value) >= min()) amountError.hidden = true;
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var a = Number(amountInput.value);
    if (!isFinite(a) || a < min() || (currency === 'CDF' && !Number.isInteger(a))) {
      amountError.textContent = 'Veuillez saisir un montant valide d’au moins ' + fmt(min()) + (currency === 'CDF' ? ' (nombre entier).' : '.');
      amountError.hidden = false; amountInput.focus(); return;
    }
    if (donorName.required && !donorName.value.trim()) { donorName.focus(); return; }
    selectedAmount = a;
    $('selectedAmount').textContent = fmt(a);
    showStep(2);
  });

  function detect(phone) {
    var d = String(phone).replace(/\D/g, '');
    if (d.indexOf('243') === 0) d = d.slice(3); else if (d.indexOf('0') === 0) d = d.slice(1);
    var pre = d.slice(0, 2);
    return Object.keys(cfg.prefixes).find(function (n) { return cfg.prefixes[n].indexOf(pre) >= 0; }) || null;
  }
  document.querySelectorAll('[data-network]').forEach(function (b) {
    b.addEventListener('click', function () {
      selectedNetwork = b.dataset.network;
      document.querySelectorAll('[data-network]').forEach(function (o) { var s = o === b; o.classList.toggle('is-selected', s); o.setAttribute('aria-pressed', String(s)); });
      networkError.hidden = true;
    });
  });
  $('payPhone').addEventListener('input', function () {
    var n = detect(this.value);
    if (n && n !== selectedNetwork && this.value.replace(/\D/g, '').length >= 9) {
      var btn = document.querySelector('[data-network="' + n + '"]'); if (btn) btn.click();
    }
  });

  $('continuePayment').addEventListener('click', function () {
    var phone = $('payPhone').value.trim();
    if (!selectedNetwork) { networkError.textContent = 'Veuillez choisir un réseau pour continuer.'; networkError.hidden = false; return; }
    if (phone.replace(/\D/g, '').length < 9) { networkError.textContent = 'Saisissez le numéro Mobile Money qui va payer.'; networkError.hidden = false; $('payPhone').focus(); return; }
    var btn = this; btn.disabled = true;
    var original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Envoi de la demande…';
    var visibility = document.querySelector('input[name="donorVisibility"]:checked').value;
    M.api('donate', {
      amount: selectedAmount, currency: currency, network: selectedNetwork, phone: phone,
      anonymous: visibility !== 'named', donor_name: donorName.value.trim(), email: ($('donorEmail') || {}).value || '',
      purpose: $('donationPurpose').value, website: $('donWebsite').value
    }).then(function (r) {
      $('finalAmount').textContent = fmt(selectedAmount);
      $('selectedNetwork').textContent = NAMES[selectedNetwork];
      $('paymentRef').textContent = r.donation.reference;
      $('paymentPendingText').innerHTML = M.esc(r.message);
      setResult('pending');
      showStep(3);
      poll(r.donation.reference, r.key);
    }).catch(function (err) {
      networkError.textContent = err.message; networkError.hidden = false;
    }).then(function () { btn.disabled = false; btn.innerHTML = original; });
  });

  function setResult(state, msg) {
    $('paymentPending').hidden = state !== 'pending';
    $('paymentSuccess').hidden = state !== 'success';
    $('paymentFailed').hidden = state !== 'failed';
    if (state === 'success') { $('successAmount').textContent = fmt(selectedAmount); document.querySelectorAll('[data-step-indicator]').forEach(function (i) { i.classList.add('is-complete'); }); }
    if (state === 'failed' && msg) $('paymentFailedText').textContent = msg;
  }
  function poll(ref, key) {
    clearTimeout(pollTimer); pollCount = 0;
    (function tick() {
      pollCount++;
      M.api('donate?ref=' + encodeURIComponent(ref) + '&key=' + encodeURIComponent(key)).then(function (r) {
        var s = r.donation.status;
        if (s === 'success') return setResult('success');
        if (s === 'failed' || s === 'cancelled') return setResult('failed', 'La transaction a été refusée ou annulée' + (r.donation.message ? ' (' + r.donation.message + ')' : '') + '. Aucun montant n’a été débité.');
        if (pollCount > 60) return setResult('failed', 'Nous n’avons pas encore reçu la confirmation. Si vous avez validé le paiement, il sera enregistré automatiquement. Référence : ' + ref);
        pollTimer = setTimeout(tick, pollCount < 10 ? 4000 : 7000);
      }).catch(function () { pollTimer = setTimeout(tick, 8000); });
    })();
  }

  document.querySelectorAll('[data-previous-step]').forEach(function (b) {
    b.addEventListener('click', function () { clearTimeout(pollTimer); showStep(Number(b.dataset.previousStep)); });
  });
})();
