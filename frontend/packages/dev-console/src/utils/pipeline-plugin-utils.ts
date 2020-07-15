import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import { PipelineRunModel, PipelineModel } from '../models';
import { Pipeline, PipelineRun } from './pipeline-augment';

// label to get the pipelines
export const INSTANCE_LABEL = 'app.kubernetes.io/instance';

export const tknPipelineAndPipelineRunsWatchResources = (
  namespace: string,
): WatchK8sResources<any> => {
  return {
    pipelines: {
      isList: true,
      kind: referenceForModel(PipelineModel),
      namespace,
      optional: true,
    },
    pipelineRuns: {
      isList: true,
      kind: referenceForModel(PipelineRunModel),
      namespace,
      optional: true,
    },
  };
};

export const tknPipelineAndPipelineRunsResources = (namespace: string): FirehoseResource[] => {
  const resources = [
    {
      isList: true,
      kind: referenceForModel(PipelineRunModel),
      namespace,
      prop: 'pipelineRuns',
      optional: true,
    },
    {
      isList: true,
      kind: referenceForModel(PipelineModel),
      namespace,
      prop: 'pipelines',
      optional: true,
    },
  ];
  return resources;
};

type PipelineItem = {
  pipelines: Pipeline[];
  pipelineRuns: PipelineRun[];
};

const byCreationTime = (left: K8sResourceKind, right: K8sResourceKind): number => {
  const leftCreationTime = new Date(left?.metadata?.creationTimestamp || Date.now());
  const rightCreationTime = new Date(right?.metadata?.creationTimestamp || Date.now());
  return rightCreationTime.getTime() - leftCreationTime.getTime();
};

const getPipelineRunsForPipeline = (pipeline: Pipeline, props): PipelineRun[] => {
  if (!props || !props.pipelineRuns) return null;
  const pipelineRunsData = props.pipelineRuns.data;
  const PIPELINE_RUN_LABEL = 'tekton.dev/pipeline';
  const pipelineName = pipeline.metadata.name;
  return pipelineRunsData
    .filter((pr: PipelineRun) => {
      return (
        pipelineName === (pr.spec?.pipelineRef?.name || pr?.metadata?.labels?.[PIPELINE_RUN_LABEL])
      );
    })
    .sort(byCreationTime);
};

export const getPipelinesAndPipelineRunsForResource = (
  resource: K8sResourceKind,
  props,
): PipelineItem => {
  const pipelinesData = props?.pipelines?.data;
  if (!pipelinesData) return null;
  const resourceInstanceName = resource?.metadata?.labels?.[INSTANCE_LABEL] || null;
  if (!resourceInstanceName) return null;
  const resourcePipeline = pipelinesData.find(
    (pl) => pl?.metadata?.labels?.[INSTANCE_LABEL] === resourceInstanceName,
  );
  if (!resourcePipeline) return null;
  return {
    pipelines: [resourcePipeline],
    pipelineRuns: getPipelineRunsForPipeline(resourcePipeline, props),
  };
};
