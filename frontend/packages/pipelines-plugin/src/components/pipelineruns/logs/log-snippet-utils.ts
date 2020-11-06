import { TFunction } from 'i18next';
import { Condition, TaskRunStatus } from '../../../utils/pipeline-augment';
import { CombinedErrorDetails } from './log-snippet-types';

const joinConditions = (conditions: Condition[], t: TFunction) =>
  conditions.map((condition) => condition.message).join('\n') ||
  t('pipelines-plugin~Unknown failure condition');

export const taskRunSnippetMessage = (
  taskName: string,
  taskRunStatus: TaskRunStatus,
  containerName: string,
  t: TFunction,
): CombinedErrorDetails => {
  if (!taskRunStatus?.podName || !containerName) {
    // Not enough to go to the logs, print all the conditions messages together
    return {
      staticMessage: joinConditions(taskRunStatus.conditions, t),
      title: t('pipelines-plugin~Failure on task {{taskName}} - check logs for details.', {
        taskName,
      }),
    };
  }
  // We don't know enough but have enough to locate the logs
  return {
    containerName,
    podName: taskRunStatus.podName,
    title: t('pipelines-plugin~Failure on task {{taskName}} - check logs for details.', {
      taskName,
    }),
  };
};
