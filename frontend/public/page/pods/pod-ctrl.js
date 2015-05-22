angular.module('bridge.page')
.controller('PodCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.podName = $routeParams.name;
  $scope.loadError = false;

  k8s.pods.get($scope.podName, $scope.ns)
    .then(function(pod) {
      $scope.pod = pod;
      $scope.loadError = false;
    })
    .catch(function() {
      $scope.pod = null;
      $scope.loadError = true;
    });

  $scope.getStatus = function(containerName) {
    return k8s.docker.getStatus($scope.pod, containerName);
  };

  $scope.getContainerState = function(containerName) {
    var cinfo = k8s.docker.getStatus($scope.pod, containerName);
    return k8s.docker.getState(cinfo);
  };

  $scope.volumeTypeLabel = function(v) {
    var vtype = k8s.pods.getVolumeType(v);
    return vtype ? vtype.label : '';
  };

  $scope.volumeLocation = k8s.pods.getVolumeLocation;

  $scope.getRestartPolicyLabel = k8s.pods.getRestartPolicyLabelById;

});
