import { Condition, PLRTaskRunStep, TaskRunKind } from '../../../types';
import { taskRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { CombinedErrorDetails } from '../../pipelineruns/logs/log-snippet-types';
import { taskRunSnippetMessage } from '../../pipelineruns/logs/log-snippet-utils';

export const getTRLogSnippet = (taskRun: TaskRunKind): CombinedErrorDetails => {
  if (!taskRun?.status) {
    // Lack information to pull from the Pipeline Run
    return null;
  }
  if (taskRunFilterReducer(taskRun) !== 'Failed') {
    // Not in a failed state, no need to get the log snippet
    return null;
  }

  const succeededCondition = taskRun.status.conditions?.find(
    (condition: Condition) => condition.type === 'Succeeded',
  );

  if (succeededCondition?.status !== 'False') {
    // Not in error / lack information
    return null;
  }

  const containerName = taskRun.status.steps?.find(
    (step: PLRTaskRunStep) => step.terminated?.exitCode !== 0,
  )?.container;

  return taskRunSnippetMessage(taskRun.metadata.name, taskRun.status, containerName);
};
