angular.module('bridge.page')
.controller('EditDeploymentCtrl', function($scope, $location, $routeParams,
                                                      activeNamespaceSvc, _, k8s, ModalLauncherSvc) {
  'use strict';

  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.deploymentName = $routeParams.name;
  $scope.loadError = false;
  $scope.loaded = false;
  $scope.deployment = {};

  k8s.deployments.get($routeParams.name, $scope.ns)
    .then(function(deployment) {
      $scope.deployment = deployment;
      $scope.loadError = false;
      $scope.loaded = true;
    })
    .catch(function() {
      $scope.loadError = true;
    });

  $scope.openVolumesModal = function() {
    ModalLauncherSvc.open('configure-volumes', {
      pod: $scope.deployment.spec.template
    });
  };

  $scope.cancel = function() {
    $location.path(activeNamespaceSvc.formatNamespaceRoute('/deployments'));
  };

  $scope.submit = function() {
    $scope.requestPromise = k8s.deployments.update($scope.deployment);
    $scope.requestPromise.then(function() {
      $location.path(activeNamespaceSvc.formatNamespaceRoute('/deployments'));
    });
  };
});
