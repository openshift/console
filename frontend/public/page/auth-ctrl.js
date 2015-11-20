angular.module('bridge.page')
.controller('AuthCtrl', function($scope, $location, $log, authSvc, featuresSvc, namespacesSvc) {
  'use strict';

  $scope.email = function() {
    return authSvc.email() || '';
  };

  $scope.emailHash = authSvc.emailHash;
  $scope.isAuthDisabled = featuresSvc.isAuthDisabled;

  // TODO joeatwork - namespaces aren't Auth - consider renaming this controller
  $scope.$watch(namespacesSvc.getActiveNamespace, function(namespace) {
    $scope.activeNamespace = namespace;
  });
});
