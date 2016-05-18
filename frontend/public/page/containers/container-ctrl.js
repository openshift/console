angular.module('bridge.page')
.controller('ContainerCtrl', function($scope, $routeParams, _, pkg, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns;

  $scope.getPullPolicyLabel = k8s.docker.getPullPolicyLabel;

  k8s.pods.get($routeParams.podName, $scope.ns).then(function(pod) {
    $scope.pod = pod;
    $scope.container = _.find(pod.spec.containers, { name: $routeParams.name });
    $scope.containerStatus = k8s.docker.getStatus(pod, $routeParams.name);
    $scope.containerState = k8s.docker.getState($scope.containerStatus);
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

  $scope.volumeAccessLabel = function(readOnly) {
    if (readOnly === true) {
      return 'Read Only';
    }
    return 'Read / Write';
  };

});
