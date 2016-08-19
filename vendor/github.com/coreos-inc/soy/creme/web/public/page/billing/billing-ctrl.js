angular.module('creme.page')
  .controller('AccountBillingCtrl', AccountBillingCtrl);

function AccountBillingCtrl($routeParams, accountSvc, messageSvc, paymentSvc, modalLauncherSvc) {
  'use strict';
  var that = this;
  this.paymentInfo = null;
  this.card = null;
  this.account = null;
  this.billingAddress = null;
  this.loadState = {
    account: {
      failed: false,
      loaded: false,
    },
    card: {
      failed: false,
      loaded: false,
    },
    invoices: {
      failed: false,
      loaded: false,
    },
    billingStatus: {
      failed: false,
      loaded: false,
    },
  };

  this.loadAccount = function() {
    that.loadState.account.loaded = false;

    return accountSvc.get($routeParams.accountID)
    .then(function(a) {
      that.account = a;
      that.billingAddress = accountSvc.billingAddress(a);
      that.loadState.account.failed = false;
    })
    .catch(function(e) {
      that.loadState.account.failed = true;
    })
    .finally(function(e) {
      that.loadState.account.loaded = true;
    });
  };

  this.loadInvoices = function() {
    that.loadState.invoices.loaded = false;

    return accountSvc.listInvoices($routeParams.accountID)
    .then(function(invs) {
      that.invoices = invs;
      that.loadState.invoices.failed = false;
    })
    .catch(function(e) {
      that.loadState.invoices.failed = true;
    })
    .finally(function(e) {
      that.loadState.invoices.loaded = true;
    });
  };

  this.loadCard = function() {
    that.loadState.card.loaded = false;

    return paymentSvc.getCard($routeParams.accountID)
    .then(function(card) {
      that.card = card;
      that.loadState.card.failed = false;
    })
    .catch(function(e) {
      that.loadState.card.failed = true;
    })
    .finally(function(e) {
      that.loadState.card.loaded = true;
    });
  };

  this.loadBillingStatus = function() {
    that.loadState.billingStatus.loaded = false;

    return accountSvc.getBillingStatus($routeParams.accountID)
    .then(function(billingStatus) {
      that.billingStatus = billingStatus;
      that.loadState.billingStatus.failed = false;
    })
    .catch(function(e) {
      that.loadState.billingStatus.failed = true;
    })
    .finally(function(e) {
      that.loadState.billingStatus.loaded = true;
    });
  };

  this.openBillingAddressModal = function() {
    modalLauncherSvc.open('update-billing-address', {
      model: this.billingAddress,
      submitFn: _.wrap(function(a) {
        return accountSvc.upsertAddress(that.account.id, a);
      }),
      defaultErrorMessage: messageSvc.get('account', 'update_error'),
    }).result
    .then(this.loadAccount);
  };

  this.openCardModal = function() {
    modalLauncherSvc.open('create-credit-card', {
      accountID: this.account.id,
      oldCard: this.card,
    }).result
    .then(function(card) {
      that.card = card;
    });
  };

  this.pdfLink = function(invoiceID) {
    if (this.account) {
      return accountSvc.getInvoicePDFLink(this.account.id, invoiceID);
    }
  };

  this.isAddressEmpty = accountSvc.isAddressEmpty;

  this.loadAccount();
  this.loadInvoices();
  this.loadCard();
  this.loadBillingStatus();
}
