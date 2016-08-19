angular.module('creme.page').controller('SignupConfirmCtrl', SignupConfirmCtrl);

function SignupConfirmCtrl($q, $scope, $location, _, signupSvc, modalLauncherSvc, errorSvc, messageSvc,
    cartSvc, paymentSvc) {
  'use strict';

  var that = this;
  var plan = signupSvc.getSelectedPlan();

  this.signupFlowIndex = 3;
  this.error = null;

  this.account = signupSvc.account();
  this.mailingAddress = signupSvc.mailingAddress();
  this.billingAddress = signupSvc.billingAddress();
  this.total = cartSvc.total();
  if (this.total === 0) {
    signupSvc.savePaymentMethod('none');
  }
  this.paymentMethod = signupSvc.paymentMethod();
  this.chargedImmediately =
    (this.paymentMethod === 'credit-card' && !!plan && !(plan.trial > 0));

  this.creditCard = signupSvc.creditCard();
  this.prefs = signupSvc.preferences();
  this.fields = {
    agreedTOS: false,
  };
  this.isAccountComplete = signupSvc.isAccountComplete;
  this.hasActiveCard = function() {
    return paymentSvc.isCardActive(this.creditCard);
  };

  this.showPaymentMethodEdit = function() {
    if (this.total === 0) {
      return false;
    }
    if (!this.isAccountComplete()) {
      return true;
    }
    if (this.isAccountComplete() && !this.hasActiveCard()) {
      return true;
    }
    return false;
  };

  this.showCreditCardEdit = function() {
    if (this.total === 0) {
      return false;
    }
    if (this.showPaymentMethodEdit()) {
      return false;
    }
    if (this.isAccountComplete() && this.hasActiveCard()) {
      return true;
    }
    return false;
  };

  this.openMailingAddressModal = function() {
    modalLauncherSvc.open('update-mailing-address', {
      model: this.mailingAddress,
      submitFn: _.wrap(function(a) {
        return $q.when(signupSvc.saveMailingAddress(a));
      }),
      defaultErrorMessage: messageSvc.get('account', 'update_error'),
    }).result
    .then(function(a) {
      that.mailingAddress = signupSvc.mailingAddress();
    });
  };

  this.openBillingAddressModal = function() {
    modalLauncherSvc.open('update-billing-address', {
      model: this.billingAddress,
      submitFn: _.wrap(function(a) {
        return $q.when(signupSvc.saveBillingAddress(a));
      }),
      defaultErrorMessage: messageSvc.get('account', 'update_error'),
    }).result
    .then(function(a) {
      that.billingAddress = signupSvc.billingAddress();
    });
  };

  this.openProfileModal = function() {
    modalLauncherSvc.open('update-profile', {
      model: this.account,
      submitFn: _.wrap(function(a) {
        return $q.when(signupSvc.saveProfile(a.profile));
      }),
      defaultErrorMessage: messageSvc.get('contact', 'update_error'),
    }).result
    .then(function(c) {
      that.account = signupSvc.account();
    });
  };

  this.openPaymentMethodModal = function() {
    modalLauncherSvc.open('update-payment-method', {
      accountID: this.account.id,
      method: this.paymentMethod,
      card: this.creditCard,
    }).result
    .then(function(result) {
      signupSvc.savePaymentMethod(result.method);
      that.paymentMethod = signupSvc.paymentMethod();
      that.creditCard = signupSvc.creditCard();
      if (that.paymentMethod === 'credit-card') {
        return signupSvc.saveCreditCard(result.card, true)
        .then(function() {
          that.creditCard = signupSvc.creditCard();
        });
      }
    });
  };

  this.openCardModal = function() {
    modalLauncherSvc.open('create-credit-card', {
      oldCard: this.creditCard,
      accountID: null,
    }).result
    .then(function(card) {
      signupSvc.saveCreditCard(card, true)
      .then(function() {
        that.creditCard = signupSvc.creditCard();
      });
    });
  };

  this.getTOSLink = function() {
    var p = signupSvc.getSelectedProduct();
    if (p) {
      return p.tosLink;
    }
  };

  this.submit = function() {
    this.error = null;
    this.submitting = true;
    signupSvc.savePreferences(this.prefs);
    signupSvc.submit()
    .then(function() {
      that.submitting = false;
      $location.replace();
      $location.path('/signup/order-complete');
    })
    .catch(function(resp) {
      var data = resp.data;
      that.submitting = false;

      if (data && !_.isEmpty(data.account)) {
        signupSvc.saveAccount(data.account);
      }

      if (data && !_.isEmpty(data.creditCard)) {
        signupSvc.saveCreditCard(data.creditCard, true);
      }

      // Signup endpoint returns special errors.
      if (data && data.error && data.error.description) {
        that.error = data.error.description;
      } else {
        that.error = errorSvc.stringify(resp);
      }
    });
  };

}
