(function () {
  'use strict';

  var donationForm = document.getElementById('donationForm');
  var amountInput = document.getElementById('donationAmount');
  var amountError = document.getElementById('amountError');
  var networkError = document.getElementById('networkError');
  var donorName = document.getElementById('donorName');
  var donorNameField = document.getElementById('donorNameField');
  var selectedAmount = 0;
  var selectedNetwork = '';
  var networkNames = {
    airtel: 'Airtel Money',
    mpesa: 'M-Pesa',
    orange: 'Orange Money'
  };

  function formatAmount(amount) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FC';
  }

  function showStep(stepNumber) {
    document.querySelectorAll('[data-donation-step]').forEach(function (step) {
      step.hidden = Number(step.dataset.donationStep) !== stepNumber;
    });

    document.querySelectorAll('[data-step-indicator]').forEach(function (indicator) {
      var number = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle('is-current', number === stepNumber);
      indicator.classList.toggle('is-complete', number < stepNumber);
    });

    document.getElementById('donationStatus').textContent = 'Étape ' + stepNumber + ' sur 3.';
  }

  document.querySelectorAll('input[name="donorVisibility"]').forEach(function (input) {
    input.addEventListener('change', function () {
      if (!input.checked) return;
      var isNamed = input.value === 'named';
      donorNameField.hidden = !isNamed;
      donorName.required = isNamed;
      if (!isNamed) donorName.value = '';
    });
  });

  document.querySelectorAll('[data-amount]').forEach(function (button) {
    button.addEventListener('click', function () {
      amountInput.value = button.dataset.amount;
      amountError.hidden = true;
      document.querySelectorAll('[data-amount]').forEach(function (option) {
        option.classList.toggle('is-selected', option === button);
      });
    });
  });

  amountInput.addEventListener('input', function () {
    document.querySelectorAll('[data-amount]').forEach(function (button) {
      button.classList.toggle('is-selected', button.dataset.amount === amountInput.value);
    });
    if (Number(amountInput.value) >= 10000) amountError.hidden = true;
  });

  donationForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var amount = Number(amountInput.value);
    if (!Number.isSafeInteger(amount) || amount < 10000) {
      amountError.hidden = false;
      amountInput.focus();
      return;
    }

    selectedAmount = amount;
    document.getElementById('selectedAmount').textContent = formatAmount(selectedAmount);
    showStep(2);
  });

  document.querySelectorAll('[data-network]').forEach(function (button) {
    button.addEventListener('click', function () {
      selectedNetwork = button.dataset.network;
      document.querySelectorAll('[data-network]').forEach(function (option) {
        var isSelected = option === button;
        option.classList.toggle('is-selected', isSelected);
        option.setAttribute('aria-pressed', String(isSelected));
      });
      networkError.hidden = true;
    });
  });

  document.getElementById('continuePayment').addEventListener('click', function () {
    if (!selectedNetwork) {
      networkError.hidden = false;
      return;
    }

    document.getElementById('selectedNetwork').textContent = networkNames[selectedNetwork];
    document.getElementById('finalAmount').textContent = formatAmount(selectedAmount);
    showStep(3);
  });

  document.querySelectorAll('[data-previous-step]').forEach(function (button) {
    button.addEventListener('click', function () {
      showStep(Number(button.dataset.previousStep));
    });
  });
})();
