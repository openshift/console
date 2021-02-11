import * as _ from 'lodash';

export const pipelineRunStatus = (pipelineRun): string => {
  const conditions = _.get(pipelineRun, ['status', 'conditions'], []);
  if (conditions.length === 0) return null;
  const succeedCondition = conditions.find((c) => c.type === 'Succeeded');
  if (!succeedCondition || !succeedCondition.status) {
    return null;
  }
  const status =
    succeedCondition.status === 'True'
      ? 'Succeeded'
      : succeedCondition.status === 'False'
      ? 'Failed'
      : 'Running';
  if (succeedCondition.reason && succeedCondition.reason !== status) {
    switch (succeedCondition.reason) {
      case 'PipelineRunCancelled':
      case 'TaskRunCancelled':
      case 'Cancelled':
        return 'Cancelled';
      case 'PipelineRunStopping':
      case 'TaskRunStopping':
        return 'Failed';
      case 'CreateContainerConfigError':
      case 'ExceededNodeResources':
      case 'ExceededResourceQuota':
        return 'Pending';
      case 'ConditionCheckFailed':
        return 'Skipped';
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
  if (!filters || !filters.selected || !filters.selected.size) {
    return true;
  }
  const status = pipelineFilterReducer(pipeline);
  return filters.selected.has(status) || !_.includes(filters.all, status);
};

export const pipelineRunStatusFilter = (phases, pipeline) => {
  if (!phases || !phases.selected || !phases.selected.size) {
    return true;
  }

  const status = pipelineRunFilterReducer(pipeline);
  return phases.selected.has(status) || !_.includes(phases.all, status);
};

export const pipelineResourceFilterReducer = (pipelineResource): string => {
  return pipelineResource.spec.type;
};

export const pipelineResourceTypeFilter = (filters, pipelineResource): boolean => {
  if (!filters || !filters.selected || !filters.selected.size) {
    return true;
  }
  const type = pipelineResourceFilterReducer(pipelineResource);
  return filters.selected.has(type) || !_.includes(filters.all, type);
};
