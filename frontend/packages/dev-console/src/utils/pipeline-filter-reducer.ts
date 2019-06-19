import * as _ from 'lodash';

export const pipelineFilterReducer = (pipeline): string => {
  if (
    !pipeline ||
    !pipeline.latestRun ||
    !pipeline.latestRun.status ||
    !pipeline.latestRun.status.succeededCondition
  ) {
    return '-';
  }
  return pipeline.latestRun.status.succeededCondition;
};

export const pipelineRunFilterReducer = (pipelineRun): string => {
  if (
    !pipelineRun ||
    !pipelineRun.status ||
    !pipelineRun.status.conditions ||
    pipelineRun.status.conditions.length === 0
  ) {
    return '-';
  }
  const condition = pipelineRun.status.conditions.find((c) => c.type === 'Succeeded');
  return !condition || !condition.status
    ? '-'
    : condition.status === 'True'
    ? 'Succeeded'
    : condition.status === 'False'
    ? 'Failed'
    : 'Running';
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
