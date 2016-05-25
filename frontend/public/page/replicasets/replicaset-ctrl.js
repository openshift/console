angular.module('bridge.page')
.controller('ReplicaSetCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns;
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

  $scope.getPodTemplateJson = function() {
    if (!$scope.rs) {
      return '';
    }
    return JSON.stringify($scope.rs.spec.template, null, 2);
  };
});
