angular.module('bridge.page')
.controller('DeploymentCtrl', function($scope, $routeParams, k8s, $interval) {
  'use strict';

  $scope.ns = $routeParams.ns;
  $scope.deploymentName = $routeParams.name;
  $scope.loadError = false;

  const update = function() {
    k8s.deployments.get($scope.deploymentName, $scope.ns)
      .then(function(deployment) {
        $scope.deployment = deployment;
        $scope.loadError = false;
      })
      .catch(function() {
        $scope.deployment = null;
        $scope.loadError = true;
      });
  };
  update();

  let intervalReference = $interval(update, 5000);
  $scope.$on('$destroy', $interval.cancel.bind(null, intervalReference));

  $scope.getPodTemplateJson = function() {
    if (!$scope.deployment) {
      return '';
    }
    return JSON.stringify($scope.deployment.spec.template, null, 2);
  };
});
