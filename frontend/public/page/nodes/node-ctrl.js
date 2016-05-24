angular.module('bridge.page')
.controller('nodeCtrl', function($scope, $routeParams, k8s, pkg) {
  'use strict';

  $scope.nodeName = $routeParams.name;
  $scope.loadError = false;
  $scope.isTrusted = k8s.nodes.isTrusted;

  $scope.getAddresses = function(status) {
    if (!pkg.propExists('addresses.length', status)) {
      return;
    }
    return pkg.join(status.addresses, ', ', function(a) {
      return a.address;
    });
  };

  k8s.nodes.get($routeParams.name)
    .then(function(node) {
      $scope.node = node;
      $scope.loadError = false;
    })
    .catch(function() {
      $scope.node = null;
      $scope.loadError = true;
    });

});
