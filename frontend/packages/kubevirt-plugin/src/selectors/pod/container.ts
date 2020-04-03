import { get, includes } from 'lodash';
import { PodKind, ContainerStatus, ContainerSpec } from '@console/internal/module/k8s';

const failedWaitingContainerReasons = ['ImagePullBackOff', 'ErrImagePull', 'CrashLoopBackOff'];
const failedTerminationContaineReasons = ['Error'];

const getContainerWaitingReason = (container: ContainerStatus) =>
  get(container, 'state.waiting.reason') as ContainerStatus['state']['waiting']['reason'];
export const getContainerImage = (container: ContainerStatus | ContainerSpec) =>
  get(container, 'image') as ContainerStatus['image'];
const getContainerTerminatedReason = (container: ContainerStatus) =>
  get(container, 'state.terminated.reason') as ContainerStatus['state']['terminated']['reason'];

const stateReasonResolver = {
  terminated: ({ reason, exitCode }) =>
    `Terminated with ${reason}${exitCode ? ` (exit code ${exitCode}).` : '.'}`,
  waiting: ({ reason }) => `Waiting (${reason}).`,
};
export const isContainerFailing = (container: ContainerStatus) =>
  !container.ready &&
  (includes(failedWaitingContainerReasons, getContainerWaitingReason(container)) ||
    includes(failedTerminationContaineReasons, getContainerTerminatedReason(container)));

export const getContainerStatusReason = (containerStatus: ContainerStatus) => {
  if (containerStatus) {
    const stateName = Object.getOwnPropertyNames(containerStatus.state).find(
      (pn) => !!containerStatus.state[pn].reason,
    );
    if (stateName) {
      const state = containerStatus.state[stateName];
      return (
        state.message ||
        (stateReasonResolver[stateName] && stateReasonResolver[stateName](state)) ||
        stateName
      );
    }
  }
  return undefined;
};

export const getContainerStatuses = (pod: PodKind) =>
  get(pod, 'status.containerStatuses', []) as PodKind['status']['containerStatuses'];

export const findFailingContainerStatus = (pod: PodKind) =>
  getContainerStatuses(pod).find(isContainerFailing);
