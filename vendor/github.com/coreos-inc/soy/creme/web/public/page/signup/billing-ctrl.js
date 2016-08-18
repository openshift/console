angular.module('creme.page')
  .controller('SignupBillingCtrl', SignupBillingCtrl);

function SignupBillingCtrl($scope, $location, signupSvc, cartSvc, errorSvc) {
  'use strict';
  this.signupFlowIndex = 2;
  this.error = null;
  this.account = signupSvc.account();
  this.mailingAddress = signupSvc.mailingAddress();
  this.billingAddress = signupSvc.billingAddress();
  this.submitting = false;
  this.paymentFields = {
    method: signupSvc.paymentMethod(),
    card: signupSvc.creditCard(),
  };

  this.total = cartSvc.total();

  this.submit = function() {
    var that = this;
    this.submitting = true;
    this.error = null;
    signupSvc.saveBillingAddress(this.billingAddress);

    if (this.total === 0) {
      signupSvc.savePaymentMethod('none');
    } else {
      signupSvc.savePaymentMethod(this.paymentFields.method);
    }

    if (signupSvc.paymentMethod() === 'credit-card') {
      signupSvc.saveCreditCard(this.paymentFields.card)
      .then(this.goToNextPage)
      .catch(function(err) {
        that.error = errorSvc.stringify(err);
      })
      .finally(function() {
        that.submitting = false;
      });
    } else {
      this.goToNextPage();
      return;
    }
  };

  this.goToNextPage = function() {
    $location.replace();
    $location.path('/signup/confirm');
  };

}
