angular.module('k8s')
.service('k8sDocker', function(_, k8sEnum, k8sUtil) {
  'use strict';

  // Parses the state from k8s container info field of a pod.
  // Returned object will always have a 'label' property,
  // but existance of other properties vary depending on the state.
  this.getState = function(containerStatus) {
    var keys, stateKey, state;
    state = {
      label: 'Unknown',
    };
    if (!containerStatus || !containerStatus.state) {
      return state;
    }

    keys = Object.keys(containerStatus.state);
    if (_.isEmpty(keys)) {
      return state;
    }

    stateKey = keys[0];
    state.label = stateKey;
    _.assign(state, containerStatus.state[stateKey]);
    return state;
  };

  this.getStatus = function(pod, containerName) {
    if (pod.status && pod.status.containerStatuses) {
      return _.find(pod.status.containerStatuses, containerName);
    }
  };

  // Nullify empty fields & prep volumes.
  this.clean = function(container) {
    k8sUtil.nullifyEmpty(container, [
      'ports',
      'volumeMounts',
      'env',
      'command',
      'dnsPolicy',
      'volumes'
    ]);

    if (container.resources && container.resources.limits) {
      k8sUtil.deleteNulls(container.resources.limits);
    }
  };

  this.getEmptyContainer = function() {
    return {
      capabilities: null,
      command: [],
      env: [],
      resources: null,
      image: null,
      imagePullPolicy: k8sEnum.PullPolicy.Always.value,
      lifecycle: null,
      livenessProbe: null,
      name: null,
      ports: [],
      privileged: false,
      terminationMessagePath: null,
      volumeMounts: [],
      workingDir: null,
    };
  };

  this.getEmptyResourceLimits = function() {
    return {
      limits: {
        cpu: null,
        memory: null,
      }
    };
  };

  this.getEmptyVolumeMount = function() {
    return {
      name: null,
      readOnly: false,
      mountPath: null,
    };
  };

  this.getEmptyEnvVar = function() {
    return {
      name: null,
      value: null,
    };
  };

  this.getEmptyPort = function() {
    return {
      containerPort: null,
      name: null,
      protocol: 'TCP',
    };
  };

  this.getPullPolicyLabel = function(container) {
    var p;
    if (!container) {
      return '';
    }
    p = this.getPullPolicyByValue(container.imagePullPolicy);
    if (p) {
      return p.label || '';
    }
    return '';
  }.bind(this);

  this.getPullPolicyByValue = function(value) {
    return _.find(k8sEnum.PullPolicy, { value: value });
  };

  this.getPullPolicyById = function(id) {
    return _.find(k8sEnum.PullPolicy, function(o) { return o.id === id; });
  };

});
