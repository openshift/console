import { k8sListResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskRunModel } from '../../models';
import { TaskRunKind } from '../../types';
import { TektonResourceLabel } from '../pipelines/const';

export const useTaskRuns = (
  namespace: string,
  pipelineRunName?: string,
): [TaskRunKind[], boolean, unknown] => {
  const taskRunResource = pipelineRunName
    ? {
        kind: referenceForModel(TaskRunModel),
        namespace,
        selector: {
          matchLabels: {
            [TektonResourceLabel.pipelinerun]: pipelineRunName,
          },
        },
        isList: true,
      }
    : {
        kind: referenceForModel(TaskRunModel),
        namespace,
        isList: true,
      };
  return useK8sWatchResource<TaskRunKind[]>(taskRunResource);
};

export const getTaskRuns = async (namespace: string, pipelineRunName?: string) => {
  const taskRunResource = pipelineRunName
    ? {
        model: TaskRunModel,
        queryParams: {
          ns: namespace,
          labelSelector: {
            matchLabels: {
              [TektonResourceLabel.pipelinerun]: pipelineRunName,
            },
          },
        },
      }
    : {
        model: TaskRunModel,
        queryParams: {
          ns: namespace,
        },
      };
  const taskRuns = await k8sListResource(taskRunResource);
  return taskRuns;
};

export const getTaskRunsOfPipelineRun = (
  taskRuns: TaskRunKind[],
  pipelineRunName: string,
): TaskRunKind[] => {
  return taskRuns.filter(
    (taskRun) => taskRun.metadata?.labels[TektonResourceLabel.pipelinerun] === pipelineRunName,
  );
};
