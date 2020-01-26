import { apiVersionForModel, referenceForModel } from '@console/internal/module/k8s';
import { Pipeline, PipelineResourceTask, PipelineTask } from '../../../utils/pipeline-augment';
import { ClusterTaskModel, PipelineModel } from '../../../models';
import { PipelineBuilderFormikValues, PipelineBuilderFormValues } from './types';

export const convertResourceToTask = (
  resource: PipelineResourceTask,
  runAfter?: string[],
): PipelineTask => {
  return {
    name: resource.metadata.name,
    runAfter,
    taskRef: {
      kind: resource.kind === ClusterTaskModel.kind ? ClusterTaskModel.kind : undefined,
      name: resource.metadata.name,
    },
    params: resource.spec.inputs?.params?.map((param) => ({
      name: param.name,
      value: param.default,
    })),
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

export const convertPipelineToBuilderForm = (pipeline: Pipeline): PipelineBuilderFormValues => {
  if (!pipeline) return null;

  const {
    metadata: { name },
    spec: { params = [], resources = [], tasks = [] },
  } = pipeline;

  return {
    name,
    params,
    resources,
    tasks,
  };
};
