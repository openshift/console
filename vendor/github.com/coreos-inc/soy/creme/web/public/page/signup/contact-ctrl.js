angular.module('creme.page').controller('SignupContactCtrl', SignupContactCtrl);

function SignupContactCtrl($scope, $location, signupSvc, authSvc, errorSvc) {
  'use strict';

  var that = this;
  this.error = null;
  this.signupFlowIndex = 1;
  this.profile = signupSvc.account().profile;
  this.profile.email = authSvc.email();
  this.mailingAddress = signupSvc.mailingAddress();
  this.submitting = false;

  if (signupSvc.isAccountComplete()) {
    this.btnText = 'Next, Confirm Order';
  } else {
    this.btnText = 'Next, Enter Billing';
  }

  this.submit = function() {
    this.error = null;
    this.submitting = true;
    signupSvc.saveProfile(this.profile);
    signupSvc.saveMailingAddress(this.mailingAddress);
    $location.replace();
    if (signupSvc.isAccountComplete()) {
      $location.path('/signup/confirm');
    } else {
      $location.path('/signup/billing');
    }
    that.submitting = false;
  };

}
