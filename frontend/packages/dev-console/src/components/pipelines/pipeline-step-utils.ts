import { getRunStatusColor, runStatus } from '../../utils/pipeline-augment';

export type TaskStatusStep = {
  name: string;
  running?: { startedAt: string };
  terminated?: {
    reason: string;
  };
  waiting?: {};
};

export type TaskStatus = {
  reason: string;
  duration?: string;
  steps?: TaskStatusStep[];
};

export const computeStepColor = (step: { name: string }, status: TaskStatus): string => {
  if (!status || !status.reason) {
    return getRunStatusColor(runStatus.Cancelled).pftoken.value;
  }
  if (status.reason !== 'In Progress') {
    return getRunStatusColor(status.reason).pftoken.value;
  }

  // In progress, try to get granular statuses
  const stepStatuses = status.steps || [];
  const matchingStep = stepStatuses.find((stepStatus) => {
    // TODO: Find a better way to link them up
    return stepStatus.name.includes(step.name);
  });
  if (!matchingStep) {
    return getRunStatusColor(runStatus.Pending).pftoken.value;
  }

  let color;
  if (matchingStep.terminated) {
    color =
      matchingStep.terminated.reason === 'Completed'
        ? getRunStatusColor(runStatus.Succeeded).pftoken.value
        : getRunStatusColor(runStatus.Failed).pftoken.value;
  } else if (matchingStep.running) {
    color = getRunStatusColor(runStatus.Running).pftoken.value;
  } else if (matchingStep.waiting) {
    color = getRunStatusColor(runStatus.Pending).pftoken.value;
  }

  return color || getRunStatusColor(runStatus.PipelineNotStarted).pftoken.value;
};
