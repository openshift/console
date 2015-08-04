angular.module('bridge.page')
.controller('AuthCtrl', function($scope, $location, $log, authSvc) {
  'use strict';

  $scope.logout = function(e) {
    if (!$scope.isAuthDisabled()) {
      authSvc.logout();
    }
    e.preventDefault();
  };

  $scope.email = function() {
    return authSvc.email() || '';
  };

  $scope.emailHash = authSvc.emailHash;
  $scope.isAuthDisabled = authSvc.isAuthDisabled;

});
