angular.module('app')
.controller('PodCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns;
  $scope.loadError = false;

  k8s.pods.get($routeParams.name, $scope.ns)
    .then(function(pod) {
      $scope.pod = pod;
      $scope.loadError = false;
    })
    .catch(function() {
      $scope.pod = null;
      $scope.loadError = true;
    });

  $scope.getContainerInfo = function(containerName) {
    if ($scope.pod.status && $scope.pod.status.info) {
      return $scope.pod.status.info[containerName];
    }
  };

  $scope.getContainerState = function(containerName) {
    var cinfo = $scope.getContainerInfo(containerName);
    return k8s.docker.getState(cinfo);
  };

  $scope.getRestartPolicyLabel = function() {
    if (!$scope.pod || !$scope.pod.spec) {
      return '';
    }
    var p = k8s.pods.getRestartPolicyByValue($scope.pod.spec.restartPolicy);
    if (p) {
      return p.label || '';
    }
  };

});
