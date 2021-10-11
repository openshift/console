import * as _ from 'lodash-es';
import i18next from 'i18next';

import { ContainerSpec, ContainerStatus, PodKind } from './';

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
  const initStatuses: ContainerStatus[] = _.get(pod, 'status.initContainerStatuses');
  const identity = (s: ContainerStatus) => s.name === containerName;
  return _.find(statuses, identity) || _.find(initStatuses, identity);
};

const getPullPolicy = (container: ContainerSpec) => {
  const pullPolicy = {
    Always: {
      id: 'Always',
      label: i18next.t('public~Always pull'),
      description: i18next.t(
        'public~Pull down a new copy of the container image whenever a new pod is created.',
      ),
      default: true,
    },
    IfNotPresent: {
      id: 'IfNotPresent',
      label: i18next.t('public~Pull if needed'),
      description: i18next.t('public~If the container isn’t available locally, pull it down.'),
    },
    Never: {
      id: 'Never',
      label: i18next.t('public~Never pull'),
      description: i18next.t(
        "public~Don't pull down a container image. If the correct container image doesn't exist locally, the pod will fail to start correctly.",
      ),
    },
  };

  return pullPolicy[container?.imagePullPolicy];
};

export const getPullPolicyLabel = (container: ContainerSpec): string => {
  return getPullPolicy(container)?.label || '';
};
