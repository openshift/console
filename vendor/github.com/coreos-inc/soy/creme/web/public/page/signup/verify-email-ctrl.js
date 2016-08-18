angular.module('creme.page').controller('SignupVerifyEmailCtrl', SignupVerifyEmailCtrl);

function SignupVerifyEmailCtrl(authSvc, $log, $location) {
  'use strict';
  if (!authSvc.isLoggedIn() || authSvc.emailVerified()) {
    $location.path('/');
    return;
  }

  this.sentStatus = null;
  this.submitting = false;

  this.resend = function() {
    var that = this;
    this.sentStatus = null;
    this.submitting = true;
    authSvc.resendVerification()
      .then(function() {
        that.sentStatus = 'ok';
        that.submitting = false;
      })
      .catch(function() {
        $log.log('error');
        that.sentStatus = 'error';
        that.submitting = false;
      });
  };

}
