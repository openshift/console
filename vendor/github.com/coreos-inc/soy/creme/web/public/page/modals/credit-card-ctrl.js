angular.module('creme.page').controller('CreditCardModalCtrl', CreditCardModalCtrl);

function CreditCardModalCtrl($modalInstance, paymentSvc, oldCard, accountID) {
  'use strict';
  var that = this;
  this.$modalInstance = $modalInstance;
  this.accountID = accountID;
  this.model = {};
  this.model.cc = oldCard ? angular.copy(oldCard) : paymentSvc.emptyCard();

  this.submit = function(form) {
    that.errorMessage = null;

    if (form.$invalid) {
      return;
    }

    if (this.accountID) {
      this.submitPromise = paymentSvc.saveCard(this.accountID, this.model.cc);
    } else {
      this.submitPromise = paymentSvc.createToken(this.model.cc);
    }

    this.submitPromise.then(function(cardResp) {
      that.model.cc = cardResp;
      that.$modalInstance.close(that.model.cc);
    })
    .catch(function(reason) {
      that.errorMessage = reason;
    });

  };

}
