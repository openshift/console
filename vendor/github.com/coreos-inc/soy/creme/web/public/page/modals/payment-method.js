angular.module('creme.page')
.controller('PaymentMethodModalCtrl', PaymentMethodModalCtrl);

function PaymentMethodModalCtrl($modalInstance, $q, paymentSvc, accountID, method, card) {
  'use strict';
  this.errorMessage = null;
  this.model = {
    accountID: accountID,
    method: method,
    card: angular.copy(card),
  };
  this.model.card.token = null;

  this.submit = function(form) {
    var that = this;
    var paymentMethodValue;
    this.errorMessage = null;
    if (form.$invalid) {
      return;
    }

    if (this.model.method === 'purchase-order') {
      paymentMethodValue = 'PURCHASE_ORDER';
      this.submitPromise = $q.when('purchase-order');
    } else {
      paymentMethodValue = 'CREDIT_CARD';
      if (paymentSvc.isCardActive(this.model.card)) {
        this.submitPromise = $q.when('active-card-on-file');
      } else {
        this.submitPromise = paymentSvc.createToken(this.model.card)
        .then(function(result) {
          that.model.card = result;
        });
      }
    }

    this.submitPromise
    .then(function() {
      $modalInstance.close(that.model);
    })
    .catch(function(e) {
      that.errorMessage = e;
    });
  };

}
