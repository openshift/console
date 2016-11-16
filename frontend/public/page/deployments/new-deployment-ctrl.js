angular.module('bridge.page')
.controller('NewDeploymentCtrl', function(_, $scope, $location, $routeParams,
                                                     activeNamespaceSvc, k8s, ModalLauncherSvc) {
  'use strict';

  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.deployment = k8s.deployments.getEmpty($scope.ns);
  $scope.podTemplate = $scope.deployment.spec.template;

  $scope.openUpdateStrategyModal = function() {
    ModalLauncherSvc.open('configure-update-strategy', {
      deploymentSpec: $scope.deployment.spec
    });
  };

  $scope.openRevisionHistoryLimitModal = function() {
    ModalLauncherSvc.open('configure-revision-history-limit', {
      deploymentSpec: $scope.deployment.spec
    });
  };

  $scope.cancel = function() {
    $location.path(activeNamespaceSvc.formatNamespaceRoute('/deployments'));
  };

  $scope.submit = function() {
    $scope.requestPromise = k8s.deployments.create($scope.deployment);
    $scope.requestPromise.then(function() {
      $location.path(activeNamespaceSvc.formatNamespaceRoute('/deployments'));
    });
  };
});
