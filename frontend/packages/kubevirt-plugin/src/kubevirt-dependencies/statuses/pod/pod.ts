import { PodKind } from '@console/internal/module/k8s';
import {
  findPodFalseStatusConditionMessage,
  getPodStatusPhase,
  isPodSchedulable,
} from '../../selectors/pod';
import {
  findFailingContainerStatus,
  getContainerStatusReason,
} from '../../selectors/pod/container';
import { Status } from '../index';
import {
  POD_STATUS_COMPLETED,
  POD_STATUS_CONTAINER_FAILING,
  POD_STATUS_CRASHLOOP_BACKOFF,
  POD_STATUS_FAILED,
  POD_STATUS_NOT_READY,
  POD_STATUS_NOT_SCHEDULABLE,
  POD_STATUS_PENDING,
  POD_STATUS_RUNNING,
  POD_STATUS_SUCCEEDED,
  POD_STATUS_UNKNOWN,
} from './constants';

const errorStatusMapper = {
  Failed: POD_STATUS_FAILED,
  CrashLoopBackOff: POD_STATUS_CRASHLOOP_BACKOFF,
  Unknown: POD_STATUS_UNKNOWN,
};

const okStatusMapper = {
  Pending: POD_STATUS_PENDING,
  Running: POD_STATUS_RUNNING,
  Completed: POD_STATUS_COMPLETED,
  Succeeded: POD_STATUS_SUCCEEDED,
};

const isNotSchedulable = (pod: PodKind): Status => {
  if (!isPodSchedulable(pod)) {
    return {
      status: POD_STATUS_NOT_SCHEDULABLE,
      message: 'Pod scheduling failed.',
    };
  }
  return null;
};

const hasErrorStatus = (pod: PodKind): Status => {
  const status = errorStatusMapper[getPodStatusPhase(pod)];

  if (status) {
    return {
      status,
      message: getContainerStatusReason(findFailingContainerStatus(pod)),
    };
  }
  return null;
};

const isContainerFailing = (pod: PodKind): Status => {
  const failingContainer = findFailingContainerStatus(pod);
  if (failingContainer) {
    return {
      status: POD_STATUS_CONTAINER_FAILING,
      message: getContainerStatusReason(failingContainer),
    };
  }
  return null;
};
const isNotReady = (pod: PodKind): Status => {
  const message = findPodFalseStatusConditionMessage(pod);
  if (message) {
    return {
      status: POD_STATUS_NOT_READY,
      message,
    };
  }
  return null;
};

const hasOkStatus = (pod: PodKind): Status => {
  const status = okStatusMapper[getPodStatusPhase(pod)];

  if (status) {
    return {
      status,
    };
  }
  return null;
};

export const getPodStatus = (pod: PodKind) =>
  isNotSchedulable(pod) ||
  hasErrorStatus(pod) ||
  isContainerFailing(pod) ||
  isNotReady(pod) ||
  hasOkStatus(pod) || { status: POD_STATUS_UNKNOWN };
