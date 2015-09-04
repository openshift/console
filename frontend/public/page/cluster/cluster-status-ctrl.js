angular.module('bridge.page')
.controller('ClusterStatusCtrl', function($scope, k8s, statusSvc) {
  'use strict';

  statusSvc.healthKubernetesApi()
  .then(function() {
    $scope.k8sApiCheckSucceeded = true;
  })
  .catch(function() {
    $scope.k8sApiCheckSucceeded = false;
  })
  .finally(function() {
    $scope.k8sApiCheckComplete = true;
  });

  statusSvc.health()
  .then(function() {
    $scope.healthCheckSucceeded = true;
  })
  .catch(function() {
    $scope.healthCheckSucceeded = false;
  })
  .finally(function() {
    $scope.healthCheckComplete = true;
  });

  statusSvc.componentStatus()
  .then(function(result) {
    $scope.status = result;
    $scope.statusLoadSucceeded = true;
  })
  .catch(function() {
    $scope.statusLoadSucceeded = false;
  })
  .finally(function() {
    $scope.statusLoadComplete = true;
  });
});
