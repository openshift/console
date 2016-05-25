angular.module('bridge.page')
.controller('DeploymentPodsCtrl', function($scope, $routeParams, k8s) {
  'use strict';
  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.deploymentName = $routeParams.name;
  $scope.loadError = false;

  k8s.deployments.get($scope.deploymentName, $scope.ns)
    .then(function(deployment) {
      $scope.deployment = deployment;
      $scope.loadError = false;
    })
    .catch(function() {
      $scope.deployment = null;
      $scope.loadError = true;
    });
});
