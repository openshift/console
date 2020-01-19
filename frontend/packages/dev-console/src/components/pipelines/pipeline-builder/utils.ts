import { K8sResourceKind } from '@console/internal/module/k8s';
import { PipelineTask } from '../../../utils/pipeline-augment';
import { ClusterTaskModel } from '../../../models';

export const convertResourceToTask = (
  resource: K8sResourceKind,
  runAfter?: string[],
): PipelineTask => {
  return {
    name: resource.metadata.name,
    runAfter,
    taskRef: {
      kind: resource.kind === ClusterTaskModel.kind ? ClusterTaskModel.kind : undefined,
      name: resource.metadata.name,
    },
  };
};
