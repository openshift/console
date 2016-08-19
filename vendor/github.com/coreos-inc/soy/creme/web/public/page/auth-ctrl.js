angular.module('creme.page').controller('AuthCtrl', AuthCtrl);

function AuthCtrl($location, $log, authSvc) {
  'use strict';
  this.logout = function() {
    authSvc.logout();
  };

  this.email = function() {
    return authSvc.email() || '';
  };
}
