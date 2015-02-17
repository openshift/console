angular.module('k8s')
.service('k8sDocker', function(_, $rootScope, k8sEnum, k8sUtil) {
  'use strict';

  // Parses the state from k8s container info field of a pod.
  // Returned object will always have a 'label' property,
  // but existance of other properties vary depending on the state.
  this.getState = function(containerInfo) {
    var keys, stateKey, state;
    state = {
      label: 'unknown',
    };
    if (!containerInfo || !containerInfo.state) {
      return state;
    }

    keys = Object.keys(containerInfo.state);
    if (_.isEmpty(keys)) {
      return state;
    }

    stateKey = keys[0];
    state.label = stateKey;
    _.extend(state, containerInfo.state[stateKey]);
    return state;
  };

  // Nullify empty fields & prep volumes.
  this.clean = function(container) {
    k8sUtil.nullifyEmpty(container, [
        'ports',
        'volumeMounts',
        'env',
        'command',
        'dnsPolicy',
        'restartPolicy',
        'volumes']);
  };

  this.getEmptyContainer = function() {
    return {
      capabilities: null,
      command: [],
      env: [],
      resources: null,
      image: null,
      imagePullPolicy: k8sEnum.PullPolicy.PullIfNotPresent,
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

});
