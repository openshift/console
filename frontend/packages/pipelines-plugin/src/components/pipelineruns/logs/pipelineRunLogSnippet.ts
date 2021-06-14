import i18next from 'i18next';
import { Condition, PipelineRunKind, PLRTaskRunData, PLRTaskRunStep } from '../../../types';
import { pipelineRunStatus } from '../../../utils/pipeline-filter-reducer';
import { CombinedErrorDetails } from './log-snippet-types';
import { taskRunSnippetMessage } from './log-snippet-utils';

export const getPLRLogSnippet = (pipelineRun: PipelineRunKind): CombinedErrorDetails => {
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
  const isKnownReason = (reason: string): boolean => {
    // known reasons https://tekton.dev/vault/pipelines-v0.21.0/pipelineruns/#monitoring-execution-status
    return ['PipelineRunCancelled', 'PipelineRunTimeout'].includes(reason);
  };

  // We're intentionally looking at the first failure because we have to start somewhere - they have the YAML still
  const failedTaskRun = failedTaskRuns[0];

  if (!failedTaskRun || isKnownReason(succeededCondition?.reason)) {
    // No specific task run failure information, just print pipeline run status
    return {
      staticMessage:
        succeededCondition.message || i18next.t('pipelines-plugin~Unknown failure condition'),
      title: i18next.t('pipelines-plugin~Failure - check logs for details.'),
    };
  }

  const containerName = failedTaskRun.status.steps?.find(
    (step: PLRTaskRunStep) => step.terminated?.exitCode !== 0,
  )?.container;

  return taskRunSnippetMessage(failedTaskRun.pipelineTaskName, failedTaskRun.status, containerName);
};
