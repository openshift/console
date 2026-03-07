import * as _ from 'lodash';
import {
  LOG_SOURCE_RESTARTING,
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
  LOG_SOURCE_WAITING,
} from '@console/internal/components/utils';
import type { ContainerSpec, ContainerStatus, PodKind } from '@console/internal/module/k8s';
import { ComputedStatus, SucceedConditionReason } from './log-snippet-types';

export const containerToLogSourceStatus = (container: ContainerStatus): string => {
  if (!container) {
    return LOG_SOURCE_WAITING;
  }
  const { state, lastState } = container;
  if (state.waiting && !_.isEmpty(lastState)) {
    return LOG_SOURCE_RESTARTING;
  }
  if (state.waiting) {
    return LOG_SOURCE_WAITING;
  }
  if (state.terminated) {
    return LOG_SOURCE_TERMINATED;
  }
  return LOG_SOURCE_RUNNING;
};

const getSortedContainerStatus = (
  containers: ContainerSpec[],
  containerStatuses: ContainerStatus[],
): ContainerStatus[] => {
  const containerNames = containers.map((c) => c.name);
  const sortedContainerStatus = [];
  containerStatuses.forEach((cs) => {
    const containerIndex = containerNames.indexOf(cs.name);
    sortedContainerStatus[containerIndex] = cs;
  });
  return sortedContainerStatus;
};

export const getRenderContainers = (
  pod: PodKind,
): { containers: ContainerSpec[]; stillFetching: boolean } => {
  const containers: ContainerSpec[] = pod?.spec?.containers ?? [];
  const containerStatuses: ContainerStatus[] = pod?.status?.containerStatuses ?? [];

  const sortedContainerStatuses = getSortedContainerStatus(containers, containerStatuses);

  const firstRunningCont = sortedContainerStatuses.findIndex(
    (container) => containerToLogSourceStatus(container) !== LOG_SOURCE_TERMINATED,
  );
  return {
    containers: containers.slice(
      0,
      firstRunningCont === -1 ? containers.length : firstRunningCont + 1,
    ),
    stillFetching: firstRunningCont !== -1,
  };
};

export const pipelineRunStatus = (pipelineRun): ComputedStatus => {
  const conditions = _.get(pipelineRun, ['status', 'conditions'], []);
  if (conditions.length === 0) return null;

  const succeedCondition = conditions.find((c) => c.type === 'Succeeded');
  const cancelledCondition = conditions.find((c) => c.reason === 'Cancelled');

  if (
    [
      SucceedConditionReason.PipelineRunStopped,
      SucceedConditionReason.PipelineRunCancelled,
    ].includes(pipelineRun.spec?.status) &&
    !cancelledCondition
  ) {
    return ComputedStatus.Cancelling;
  }

  if (!succeedCondition || !succeedCondition.status) {
    return null;
  }

  const status =
    succeedCondition.status === 'True'
      ? ComputedStatus.Succeeded
      : succeedCondition.status === 'False'
      ? ComputedStatus.Failed
      : ComputedStatus.Running;

  if (succeedCondition.reason && succeedCondition.reason !== status) {
    switch (succeedCondition.reason) {
      case SucceedConditionReason.PipelineRunCancelled:
      case SucceedConditionReason.TaskRunCancelled:
      case SucceedConditionReason.Cancelled:
      case SucceedConditionReason.PipelineRunStopped:
        return ComputedStatus.Cancelled;
      case SucceedConditionReason.PipelineRunStopping:
      case SucceedConditionReason.TaskRunStopping:
        return ComputedStatus.Failed;
      case SucceedConditionReason.CreateContainerConfigError:
      case SucceedConditionReason.ExceededNodeResources:
      case SucceedConditionReason.ExceededResourceQuota:
      case SucceedConditionReason.PipelineRunPending:
        return ComputedStatus.Pending;
      case SucceedConditionReason.ConditionCheckFailed:
        return ComputedStatus.Skipped;
      default:
        return status;
    }
  }
  return status;
};
