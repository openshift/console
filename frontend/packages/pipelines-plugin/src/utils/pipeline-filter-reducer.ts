import i18next from 'i18next';
import * as _ from 'lodash';
import { ComputedStatus } from '../types';

export enum SucceedConditionReason {
  PipelineRunCancelled = 'StoppedRunFinally',
  PipelineRunStopped = 'CancelledRunFinally',
  TaskRunCancelled = 'TaskRunCancelled',
  Cancelled = 'Cancelled',
  PipelineRunStopping = 'PipelineRunStopping',
  PipelineRunPending = 'PipelineRunPending',
  TaskRunStopping = 'TaskRunStopping',
  CreateContainerConfigError = 'CreateContainerConfigError',
  ExceededNodeResources = 'ExceededNodeResources',
  ExceededResourceQuota = 'ExceededResourceQuota',
  ConditionCheckFailed = 'ConditionCheckFailed',
}

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

// Converts the PipelineRun (and TaskRun) condition status into a human readable string.
// See also tkn cli implementation at https://github.com/tektoncd/cli/blob/release-v0.15.0/pkg/formatted/k8s.go#L54-L83
export const pipelineRunStatusTitle = (pipelineRun): string => {
  const status = pipelineRunStatus(pipelineRun);
  if (!status) return '-';
  switch (status) {
    case ComputedStatus.Cancelled:
      return i18next.t('pipelines-plugin~Cancelled');
    case ComputedStatus.Failed:
      return i18next.t('pipelines-plugin~Failed');
    case ComputedStatus.Succeeded:
      return i18next.t('pipelines-plugin~Succeeded');
    case ComputedStatus.Pending:
      return i18next.t('pipelines-plugin~Pending');
    case ComputedStatus.Running:
      return i18next.t('pipelines-plugin~Running');
    case ComputedStatus.Skipped:
      return i18next.t('pipelines-plugin~Skipped');
    case ComputedStatus.Cancelling:
      return i18next.t('pipelines-plugin~Cancelling');
    default:
      return status;
  }
};

export const pipelineFilterReducer = (pipeline): ComputedStatus => {
  if (!pipeline.latestRun) return ComputedStatus.Other;
  return pipelineRunStatus(pipeline.latestRun) || ComputedStatus.Other;
};

export const pipelineTitleFilterReducer = (pipeline): string => {
  if (!pipeline.latestRun) return '-';
  return pipelineRunStatusTitle(pipeline.latestRun) || '-';
};

export const pipelineRunTitleFilterReducer = (pipelineRun): string => {
  const status = pipelineRunStatusTitle(pipelineRun);
  return status || '-';
};
export const pipelineRunFilterReducer = (pipelineRun): ComputedStatus => {
  const status = pipelineRunStatus(pipelineRun);
  return status || ComputedStatus.Other;
};

export const pipelineStatusFilter = (filters, pipeline) => {
  if (!filters || !filters.selected || !filters.selected.length) {
    return true;
  }
  const status = pipelineFilterReducer(pipeline);
  return filters.selected?.includes(status) || !_.includes(filters.all, status);
};

export const pipelineRunStatusFilter = (phases, pipeline) => {
  if (!phases || !phases.selected || !phases.selected.length) {
    return true;
  }

  const status = pipelineRunFilterReducer(pipeline);
  return phases.selected?.includes(status) || !_.includes(phases.all, status);
};

export const pipelineResourceFilterReducer = (pipelineResource): string => {
  return pipelineResource.spec.type;
};

export const pipelineResourceTypeFilter = (filters, pipelineResource): boolean => {
  if (!filters || !filters.selected || !filters.selected.length) {
    return true;
  }
  const type = pipelineResourceFilterReducer(pipelineResource);
  return filters.selected?.includes(type) || !_.includes(filters.all, type);
};

export const taskRunFilterReducer = (taskRun): ComputedStatus => {
  const status = pipelineRunStatus(taskRun);
  return status || ComputedStatus.Other;
};

export const taskRunFilterTitleReducer = (taskRun): string => {
  const status = pipelineRunStatusTitle(taskRun);
  return status || '-';
};
