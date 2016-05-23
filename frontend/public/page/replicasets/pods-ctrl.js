angular.module('bridge.page')
.controller('ReplicaSetPodsCtrl', function($scope, $routeParams, k8s) {
  'use strict';
  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.rsName = $routeParams.name;
  $scope.loadError = false;

  k8s.replicasets.get($scope.rsName, $scope.ns)
    .then(function(rs) {
      $scope.rs = rs;
      $scope.loadError = false;
    })
    .catch(function() {
      $scope.rs = null;
      $scope.loadError = true;
    });
});
