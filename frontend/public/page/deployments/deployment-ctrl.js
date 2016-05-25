angular.module('bridge.page')
.controller('DeploymentCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns;
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

  $scope.getPodTemplateJson = function() {
    if (!$scope.deployment) {
      return '';
    }
    return JSON.stringify($scope.deployment.spec.template, null, 2);
  };
});
