angular.module('bridge.page')
.controller('AuthCtrl', function($scope, $location, $log, authSvc, featuresSvc, activeNamespaceSvc) {
  'use strict';

  $scope.email = function() {
    return authSvc.email() || '';
  };

  $scope.emailHash = authSvc.emailHash;
  $scope.isAuthDisabled = featuresSvc.isAuthDisabled;

  // TODO joeatwork - namespaces aren't Auth - consider renaming this controller
  $scope.$watch(activeNamespaceSvc.getActiveNamespace, function(namespace) {
    $scope.activeNamespace = namespace;
  });
});
