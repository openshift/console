angular.module('bridge.page')
.controller('MachineCtrl', function($scope, $routeParams, k8s, pkg) {
  'use strict';

  $scope.machineName = $routeParams.name;
  $scope.loadError = false;

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
      $scope.machine = node;
      $scope.loadError = false;
    })
    .catch(function() {
      $scope.machine = null;
      $scope.loadError = true;
    });

});
