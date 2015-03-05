angular.module('app')
.controller('ContainerCtrl', function($scope, $routeParams, _, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns;

  $scope.getPullPolicyLabel = k8s.docker.getPullPolicyLabel;

  k8s.pods.get($routeParams.podName, $scope.ns).then(function(pod) {
    $scope.pod = pod;
    $scope.container = _.findWhere(pod.spec.containers, { name: $routeParams.name });
    if (pod.status && pod.status.info) {
      $scope.container.info = pod.status.info[$routeParams.name];
    }
    $scope.containerState = k8s.docker.getState($scope.container.info);
  });

  $scope.getHookLabel = function(stage) {
    if (!$scope.container) {
      return '';
    }
    return k8s.lifecycle.getHookLabel($scope.container.lifecycle, stage);
  };

  $scope.getHookHandler = function(stage) {
    var fields;
    if (!$scope.container || !$scope.container.lifecycle) {
      return '';
    }
    fields = k8s.lifecycle.mapLifecycleConfigToFields($scope.container.lifecycle);
    return fields[stage].cmd;
  };

});
