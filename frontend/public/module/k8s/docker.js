import * as _ from 'lodash-es';

const PullPolicy = {
  Always: {
    id: 'Always',
    label: 'Always Pull',
    description: 'Pull down a new copy of the container image whenever a new pod is created.',
    default: true,
  },
  IfNotPresent: {
    id: 'IfNotPresent',
    label: 'Pull If Needed',
    description: 'If the container isn’t available locally, pull it down.',
  },
  Never: {
    id: 'Never',
    label: 'Never Pull',
    description: 'Don\'t pull down a container image. ' +
      'If the correct container image doesn\'t exist locally, the pod will fail to start correctly.',
  },
};

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
  const statuses = _.get(pod, 'status.containerStatuses');
  const initStatuses = _.get(pod, 'status.initContainerStatuses');
  const identity = { name: containerName };
  return _.find(statuses, identity) || _.find(initStatuses, identity);
};

const getPullPolicy = container => _.find(PullPolicy, {id: _.get(container, 'imagePullPolicy')});

export const getPullPolicyLabel = container => _.get(getPullPolicy(container), 'label', '');
