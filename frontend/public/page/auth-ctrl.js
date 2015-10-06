angular.module('bridge.page')
.controller('AuthCtrl', function($scope, $location, $log, authSvc, featuresSvc, k8s) {
  'use strict';

  $scope.email = function() {
    return authSvc.email() || '';
  };

  $scope.emailHash = authSvc.emailHash;
  $scope.isAuthDisabled = featuresSvc.isAuthDisabled;
  $scope.$watch(k8s.namespaces.getActiveNamespace, function(namespace) {
    $scope.activeNamespace = namespace;
  });
});
