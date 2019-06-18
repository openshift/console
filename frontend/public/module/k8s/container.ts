import * as _ from 'lodash';

import { ContainerSpec, ContainerStatus, PodKind } from './';

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
export const getContainerState = (containerStatus: ContainerStatus): any => {
  const state: any = {
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
  _.assign(state, containerStatus.state[stateKey]);
  state.label = _.startCase(stateKey);
  state.value = stateKey;
  return state;
};

export const getContainerStatus = (pod: PodKind, containerName: string): ContainerStatus => {
  const statuses: ContainerStatus[] = _.get(pod, 'status.containerStatuses');
  const initStatuses : ContainerStatus[]= _.get(pod, 'status.initContainerStatuses');
  const identity = (s: ContainerStatus) => s.name === containerName;
  return _.find(statuses, identity) || _.find(initStatuses, identity);
};

const getPullPolicy = (container: ContainerSpec) => _.find(PullPolicy, {id: _.get(container, 'imagePullPolicy')});

export const getPullPolicyLabel = (container: ContainerSpec): string => _.get(getPullPolicy(container), 'label', '');
