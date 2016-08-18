angular.module('creme.page').controller('SignupOrderCompleteCtrl', SignupOrderCompleteCtrl);

function SignupOrderCompleteCtrl(accountSvc) {
  'use strict';
  var that = this;
  var currentID = accountSvc.currentID();
  accountSvc.loadByID(currentID)
  .then(function(acct) {
    that.account = acct;
  });
}
