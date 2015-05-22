angular.module('bridge.page')
.controller('ReplicationcontrollerPodsCtrl', function($scope, $routeParams, k8s) {
  'use strict';
  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.rcName = $routeParams.name;
  $scope.loadError = false;

  k8s.replicationcontrollers.get($scope.rcName, $scope.ns)
    .then(function(rc) {
      $scope.rc = rc;
      $scope.loadError = false;
    })
    .catch(function() {
      $scope.rc = null;
      $scope.loadError = true;
    });

});
