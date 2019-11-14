import { formatDuration } from '@console/internal/components/utils/datetime';
import { runStatus } from '../../../../utils/pipeline-augment';

enum TerminatedReasons {
  Completed = 'Completed',
}

export type TaskStatusStep = {
  name: string;
  running?: { startedAt: string };
  terminated?: {
    finishedAt: string;
    reason: TerminatedReasons;
    startedAt: string;
  };
  waiting?: {};
};

export type TaskStatus = {
  reason: runStatus;
  duration?: string;
  steps?: TaskStatusStep[];
};

const getMatchingStep = (step, status: TaskStatus): TaskStatusStep => {
  const statusSteps: TaskStatusStep[] = status.steps || [];
  return statusSteps.find((statusStep) => {
    // In rare occasions the status step name is prefixed with `step-`
    // This is likely a bug but this workaround will be temporary as it's investigated separately
    return statusStep.name === step.name || statusStep.name === `step-${step.name}`;
  });
};

const calculateDurationFormatted = ({ startedAt, finishedAt }): string => {
  const date = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  return formatDuration(date);
};

const getMatchingStepDuration = (matchingStep?: TaskStatusStep) => {
  if (!matchingStep) return '';

  if (matchingStep.terminated) {
    return calculateDurationFormatted(matchingStep.terminated);
  }
  if (matchingStep.running) {
    return calculateDurationFormatted({
      startedAt: matchingStep.running.startedAt,
      finishedAt: Date.now(),
    });
  }

  return '';
};

export type StepStatus = {
  duration: string | null;
  name: string;
  runStatus: runStatus;
};

export const createStepStatus = (step: { name: string }, status: TaskStatus): StepStatus => {
  let stepRunStatus: runStatus = runStatus.PipelineNotStarted;
  let duration: string = null;

  if (!status || !status.reason) {
    stepRunStatus = runStatus.Cancelled;
  } else if (status.reason === runStatus['In Progress']) {
    // In progress, try to get granular statuses
    const matchingStep: TaskStatusStep = getMatchingStep(step, status);

    if (!matchingStep) {
      stepRunStatus = runStatus.Pending;
    } else if (matchingStep.terminated) {
      stepRunStatus =
        matchingStep.terminated.reason === TerminatedReasons.Completed
          ? runStatus.Succeeded
          : runStatus.Failed;
      duration = getMatchingStepDuration(matchingStep);
    } else if (matchingStep.running) {
      stepRunStatus = runStatus['In Progress'];
      duration = getMatchingStepDuration(matchingStep);
    } else if (matchingStep.waiting) {
      stepRunStatus = runStatus.Pending;
    }
  } else {
    // Not in progress, just use the run status reason
    stepRunStatus = status.reason;

    duration = getMatchingStepDuration(getMatchingStep(step, status)) || status.duration;
  }

  return {
    duration,
    name: step.name,
    runStatus: stepRunStatus,
  };
};
