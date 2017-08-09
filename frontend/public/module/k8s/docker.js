import {k8sEnum} from './enum';
import {util} from './util';

// Parses the state from k8s container info field of a pod.
// Returned object will always have a 'label' property,
// but existence of other properties vary depending on the state.
export const getContainerState = function(containerStatus) {
  const state = {
    label: 'Unknown',
  };
  if (!containerStatus || !containerStatus.state) {
    return state;
  }

  const keys = Object.keys(containerStatus.state);
  if (_.isEmpty(keys)) {
    return state;
  }

  const stateKey = keys[0];
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

const getPullPolicy = container => _.find(k8sEnum.PullPolicy, {id: _.get(container, 'imagePullPolicy')});

export const getPullPolicyLabel = container => _.get(getPullPolicy(container), 'label', '');
