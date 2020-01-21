import {
  apiVersionForModel,
  K8sResourceKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { Pipeline, PipelineTask } from '../../../utils/pipeline-augment';
import { ClusterTaskModel, PipelineModel } from '../../../models';
import { PipelineBuilderFormikValues } from './types';

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

export const getPipelineURL = (namespace: string) => {
  return `/k8s/ns/${namespace}/${referenceForModel(PipelineModel)}`;
};

export const convertBuilderFormToPipeline = (
  formValues: PipelineBuilderFormikValues,
  namespace: string,
): Pipeline => {
  const { name, resources, params, tasks } = formValues;

  return {
    apiVersion: apiVersionForModel(PipelineModel),
    kind: PipelineModel.kind,
    metadata: {
      name,
      namespace,
    },
    spec: {
      params,
      resources,
      tasks,
    },
  };
};
