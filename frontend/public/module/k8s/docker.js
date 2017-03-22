import {k8sEnum} from './enum';
import {util} from './util';

// Parses the state from k8s container info field of a pod.
// Returned object will always have a 'label' property,
// but existence of other properties vary depending on the state.
export const getContainerState = function(containerStatus) {
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

export const getContainerStatus = function(pod, containerName) {
  const statuses = _.get(pod, 'status.containerStatuses', []);
  return _.find(statuses, {name: containerName});
};

// Nullify empty fields & prep volumes.
export const clean = function(container) {
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

export const getEmptyContainer = function() {
  return {
    capabilities: null,
    command: [],
    env: [],
    resources: null,
    image: null,
    imagePullPolicy: k8sEnum.PullPolicy.Always.id,
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

export const getEmptyResourceLimits = function() {
  return {
    limits: {
      cpu: null,
      memory: null,
    }
  };
};

export const getEmptyVolumeMount = function() {
  return {
    name: null,
    readOnly: false,
    mountPath: null,
  };
};

export const isVolumeMountEmpty = function(volumeMount) {
  return _.isEmpty(volumeMount.name) || _.isEmpty(volumeMount.mountPath);
};

export const getEmptyEnvVar = function() {
  return {
    name: null,
    value: null,
  };
};

export const isEnvVarEmpty = function(envVar) {
  // check for name, but not value as for many applications existence of
  // env var is enough to trigger the behavior
  return !envVar.name;
};

export const getEmptyPort = function() {
  return {
    containerPort: null,
    name: null,
    protocol: 'TCP',
  };
};

export const isPortEmpty = function(port) {
  return _.isNull(port.containerPort) || _.isEmpty(port.name);
};

const getPullPolicy = container => _.find(k8sEnum.PullPolicy, {id: _.get(container, 'imagePullPolicy')});

export const getPullPolicyLabel = container => _.get(getPullPolicy(container), 'label', '');
