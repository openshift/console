import i18next from 'i18next';
import * as _ from 'lodash';

export enum SucceedConditionReason {
  PipelineRunCancelled = 'PipelineRunCancelled',
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

// Converts the PipelineRun (and TaskRun) condition status into a human readable string.
// See also tkn cli implementation at https://github.com/tektoncd/cli/blob/release-v0.15.0/pkg/formatted/k8s.go#L54-L83
export const pipelineRunStatus = (pipelineRun): string => {
  const conditions = _.get(pipelineRun, ['status', 'conditions'], []);
  if (conditions.length === 0) return null;

  const succeedCondition = conditions.find((c) => c.type === 'Succeeded');
  if (!succeedCondition || !succeedCondition.status) {
    return null;
  }
  const status =
    succeedCondition.status === 'True'
      ? i18next.t('pipelines-plugin~Succeeded')
      : succeedCondition.status === 'False'
      ? i18next.t('pipelines-plugin~Failed')
      : i18next.t('pipelines-plugin~Running');

  if (succeedCondition.reason && succeedCondition.reason !== status) {
    switch (succeedCondition.reason) {
      case SucceedConditionReason.PipelineRunCancelled:
      case SucceedConditionReason.TaskRunCancelled:
      case SucceedConditionReason.Cancelled:
        return i18next.t('pipelines-plugin~Cancelled');
      case SucceedConditionReason.PipelineRunStopping:
      case SucceedConditionReason.TaskRunStopping:
        return i18next.t('pipelines-plugin~Failed');
      case SucceedConditionReason.CreateContainerConfigError:
      case SucceedConditionReason.ExceededNodeResources:
      case SucceedConditionReason.ExceededResourceQuota:
      case SucceedConditionReason.PipelineRunPending:
        return i18next.t('pipelines-plugin~Pending');
      case SucceedConditionReason.ConditionCheckFailed:
        return i18next.t('pipelines-plugin~Skipped');
      default:
        return status;
    }
  }
  return status;
};

export const pipelineFilterReducer = (pipeline): string => {
  if (!pipeline.latestRun) return '-';
  return pipelineRunStatus(pipeline.latestRun) || '-';
};

export const pipelineRunFilterReducer = (pipelineRun): string => {
  const status = pipelineRunStatus(pipelineRun);
  return status || '-';
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

export const taskRunFilterReducer = (taskRun): string => {
  const status = pipelineRunStatus(taskRun);
  return status || '-';
};
