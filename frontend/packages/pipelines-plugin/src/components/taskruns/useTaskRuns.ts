import { k8sListResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskRunModel } from '../../models';
import { TaskRunKind } from '../../types';
import { TektonResourceLabel } from '../pipelines/const';

export const useTaskRuns = (
  namespace: string,
  pipelineRunName: string,
): [TaskRunKind[], boolean, unknown] =>
  useK8sWatchResource<TaskRunKind[]>({
    kind: referenceForModel(TaskRunModel),
    namespace,
    selector: {
      matchLabels: {
        [TektonResourceLabel.pipelinerun]: pipelineRunName,
      },
    },
    isList: true,
  });

export const getTaskRuns = async (namespace: string, pipelineRunName: string) => {
  const taskRuns = await k8sListResource({
    model: TaskRunModel,
    queryParams: {
      ns: namespace,
      labelSelector: {
        matchLabels: {
          [TektonResourceLabel.pipelinerun]: pipelineRunName,
        },
      },
    },
  });
  return taskRuns;
};
