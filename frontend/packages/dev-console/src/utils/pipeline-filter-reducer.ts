import * as _ from 'lodash';

export const pipelineRunStatus = (pipelineRun): string => {
  const conditions = _.get(pipelineRun, ['status', 'conditions'], []);
  const isCancelled = conditions.find((c) =>
    ['PipelineRunCancelled', 'TaskRunCancelled'].some((cancel) => cancel === c.reason),
  );
  if (isCancelled) {
    return 'Cancelled';
  }
  if (conditions.length === 0) return null;

  const condition = conditions.find((c) => c.type === 'Succeeded');
  return !condition || !condition.status
    ? null
    : condition.status === 'True'
    ? 'Succeeded'
    : condition.status === 'False'
    ? 'Failed'
    : 'Running';
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
