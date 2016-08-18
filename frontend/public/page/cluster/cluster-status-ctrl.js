angular.module('bridge.page')
.controller('ClusterStatusCtrl', function($scope, k8s, statusSvc) {
  'use strict';

  $scope.isStrange = function(v) {
    return !(v === 'True' || v === 'False');
  };

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

  statusSvc.kubernetesVersion()
  .then(function(resp) {
    $scope.k8sVersion = resp.data.gitVersion;
    $scope.k8sVersionCheckSucceeded = true;
  })
  .catch(function() {
    $scope.k8sVersionCheckSucceeded = false;
  })
  .finally(function() {
    $scope.k8sVersionCheckComplete = true;
  });

  statusSvc.tectonicVersion()
  .then(function(resp) {
    $scope.tectonicVersion = resp.data.version;
    $scope.tectonicTier = resp.data.tier;
    $scope.tectonicVersionCheckSucceeded = true;
  })
  .catch(function() {
    $scope.tectonicVersionCheckSucceeded = false;
  })
  .finally(function() {
    $scope.tectonicVersionCheckComplete = true;
  });

  statusSvc.componentStatus()
  .then(function(result) {
    $scope.status = result;
  })
  .finally(function() {
    $scope.statusLoadComplete = true;
  });
});
