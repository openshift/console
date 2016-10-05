angular.module('bridge.page')
.controller('ContainerCtrl', function($scope, $routeParams, _, k8s) {
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

  $scope.getResourceLimitValue = function() {
    const limits = _.get($scope.container, 'resources.limits');
    return limits && _.map(limits, (v, k) => `${k}: ${v}`).join(', ');
  };

  $scope.volumeAccessLabel = function(readOnly) {
    if (readOnly === true) {
      return 'Read Only';
    }
    return 'Read / Write';
  };

  $scope.envVarValueLabel = function(env) {
    const fieldRef = _.get(env, 'valueFrom.fieldRef');
    if (fieldRef) {
      return `field: ${fieldRef.fieldPath}`;
    }

    const resourceFieldRef = _.get(env, 'valueFrom.resourceFieldRef');
    if (resourceFieldRef) {
      return `resource: ${resourceFieldRef.resource}`;
    }

    const configMapKeyRef = _.get(env, 'valueFrom.configMapKeyRef');
    if (configMapKeyRef) {
      return `config-map: ${configMapKeyRef.name}/${configMapKeyRef.key}`;
    }

    const secretKeyRef = _.get(env, 'valueFrom.secretKeyRef');
    if (secretKeyRef) {
      return `secret: ${secretKeyRef.name}/${secretKeyRef.key}`;
    }

    return env.value;
  };

});
