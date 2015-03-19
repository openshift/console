angular.module('app')
.controller('ContainerCtrl', function($scope, $routeParams, _, pkg, k8s) {
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

  $scope.getLivenessLabel = function() {
    if ($scope.container) {
      return k8s.probe.getActionLabelFromObject($scope.container.livenessProbe);
    }
    return '';
  };

  $scope.getLivenessValue = function() {
    var fields;
    if (!$scope.container || !$scope.container.livenessProbe) {
      return '';
    }
    fields = k8s.probe.mapLivenessProbeToFields($scope.container.livenessProbe);
    return fields.cmd;
  };

  $scope.getLifecycleLabel = function(stage) {
    if (!$scope.container) {
      return '';
    }
    return k8s.probe.getLifecycleHookLabel($scope.container.lifecycle, stage);
  };

  $scope.getLifecycleValue = function(stage) {
    var fields;
    if (!$scope.container || !$scope.container.lifecycle) {
      return '';
    }
    fields = k8s.probe.mapLifecycleConfigToFields($scope.container.lifecycle);
    return fields[stage].cmd;
  };

  $scope.getresourcelimitvalue = function() {
    if (!pkg.propExists('resources.limits', $scope.container)) {
      return '';
    }

    return pkg.join($scope.container.resources.limits, ', ', function(v, k) {
      return k + ': ' + v;
    });
  };

});
