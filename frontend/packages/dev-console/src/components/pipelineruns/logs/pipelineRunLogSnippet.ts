import {
  Condition,
  PipelineRun,
  PLRTaskRunData,
  PLRTaskRunStep,
} from '../../../utils/pipeline-augment';
import { pipelineRunStatus } from '../../../utils/pipeline-filter-reducer';

type ErrorDetails = {
  title: string;
};

type ErrorDetailsWithLogName = ErrorDetails & {
  containerName: string;
  podName: string;
};
type ErrorDetailsWithStaticLog = ErrorDetails & {
  staticMessage: string;
};

export type PipelineRunErrorDetails = ErrorDetailsWithLogName | ErrorDetailsWithStaticLog;

const joinConditions = (conditions: Condition[]) =>
  conditions.map((condition) => condition.message).join('\n') || 'Unknown failure condition';

export const getLogSnippet = (pipelineRun: PipelineRun): PipelineRunErrorDetails => {
  if (!pipelineRun?.status) {
    // Lack information to pull from the Pipeline Run
    return null;
  }
  if (pipelineRunStatus(pipelineRun) !== 'Failed') {
    // Not in a failed state, no need to get the log snippet
    return null;
  }

  const succeededCondition = pipelineRun.status.conditions?.find(
    (condition: Condition) => condition.type === 'Succeeded',
  );

  if (succeededCondition?.status !== 'False') {
    // Not in error / lack information
    return null;
  }

  const taskRuns: PLRTaskRunData[] = Object.values(pipelineRun.status.taskRuns || {});
  const failedTaskRuns = taskRuns.filter((taskRun) =>
    taskRun?.status?.conditions?.find(
      (condition) => condition.type === 'Succeeded' && condition.status === 'False',
    ),
  );
  // We're intentionally looking at the first failure because we have to start somewhere - they have the YAML still
  const failedTaskRun = failedTaskRuns[0];

  if (!failedTaskRun) {
    // No specific task run failure information, just print pipeline run status
    return {
      staticMessage: succeededCondition.message || 'Unknown failure condition',
      title: 'Failure - check logs for details.',
    };
  }

  const containerName = failedTaskRun.status.steps?.find(
    (step: PLRTaskRunStep) => step.terminated.exitCode !== 0,
  )?.container;

  if (!failedTaskRun.status.podName || !containerName) {
    // Not enough to go to the logs, print all the conditions messages together
    return {
      staticMessage: joinConditions(failedTaskRun.status.conditions),
      title: `Failure on task ${failedTaskRun.pipelineTaskName} - check logs for details.`,
    };
  }

  // We don't know enough but have enough to locate the logs
  return {
    containerName,
    podName: failedTaskRun.status.podName,
    title: `Failure on task ${failedTaskRun.pipelineTaskName} - check logs for details.`,
  };
};
