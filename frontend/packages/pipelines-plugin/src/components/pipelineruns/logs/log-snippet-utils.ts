import i18next from 'i18next';
import { Condition, TaskRunStatus } from '../../../types';
import { CombinedErrorDetails } from './log-snippet-types';

const joinConditions = (conditions: Condition[]) =>
  conditions.map((condition) => condition.message).join('\n') ||
  i18next.t('pipelines-plugin~Unknown failure condition');

export const taskRunSnippetMessage = (
  taskName: string,
  taskRunStatus: TaskRunStatus,
  containerName: string,
): CombinedErrorDetails => {
  if (!taskRunStatus?.podName || !containerName) {
    // Not enough to go to the logs, print all the conditions messages together
    return {
      staticMessage: joinConditions(taskRunStatus.conditions),
      title: i18next.t('pipelines-plugin~Failure on task {{taskName}} - check logs for details.', {
        taskName,
      }),
    };
  }
  // We don't know enough but have enough to locate the logs
  return {
    containerName,
    podName: taskRunStatus.podName,
    title: i18next.t('pipelines-plugin~Failure on task {{taskName}} - check logs for details.', {
      taskName,
    }),
  };
};
