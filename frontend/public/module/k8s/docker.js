import {k8sEnum} from './enum';
import {util} from './util';

angular.module('k8s')
.service('k8sDocker', function(_) {
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
    const statuses = _.get(pod, 'status.containerStatuses', []);
    return _.find(statuses, {name: containerName});
  };

  // Nullify empty fields & prep volumes.
  this.clean = function(container) {
    util.nullifyEmpty(container, [
      'ports',
      'volumeMounts',
      'env',
      'command',
      'dnsPolicy',
      'volumes'
    ]);

    if (container.resources && container.resources.limits) {
      util.deleteNulls(container.resources.limits);
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

  this.isVolumeMountEmpty = function(volumeMount) {
    return _.isEmpty(volumeMount.name) || _.isEmpty(volumeMount.mountPath);
  };

  this.getEmptyEnvVar = function() {
    return {
      name: null,
      value: null,
    };
  };

  this.isEnvVarEmpty = function(envVar) {
    // check for name, but not value as for many applications existence of
    // env var is enough to trigger the behavior
    return !envVar.name;
  };

  this.getEmptyPort = function() {
    return {
      containerPort: null,
      name: null,
      protocol: 'TCP',
    };
  };

  this.isPortEmpty = function(port) {
    return _.isNull(port.containerPort) || _.isEmpty(port.name);
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
