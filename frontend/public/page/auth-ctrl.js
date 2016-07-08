angular.module('bridge.page')
.controller('AuthCtrl', function($scope, authSvc) {
  'use strict';

  $scope.email = function() {
    return authSvc.email() || '';
  };

  $scope.emailHash = authSvc.emailHash;
});
