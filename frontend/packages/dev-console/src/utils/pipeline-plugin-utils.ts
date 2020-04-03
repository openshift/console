import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s/types';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import { PipelineRunModel, PipelineModel } from '../models';
import { Pipeline, PipelineRun } from './pipeline-augment';

// label to get the pipelines
export const INSTANCE_LABEL = 'app.kubernetes.io/instance';

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
  pipelines: K8sResourceKind[];
  pipelineRuns: K8sResourceKind[];
};

const byCreationTime = (left: K8sResourceKind, right: K8sResourceKind): number => {
  const leftCreationTime = new Date(_.get(left, ['metadata', 'creationTimestamp'], Date.now()));
  const rightCreationTime = new Date(_.get(right, ['metadata', 'creationTimestamp'], Date.now()));
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
        pipelineName ===
        (_.get(pr, ['spec', 'pipelineRef', 'name'], null) ||
          _.get(pr, ['metadata', 'labels', PIPELINE_RUN_LABEL], null))
      );
    })
    .sort(byCreationTime);
};

export const getPipelinesAndPipelineRunsForResource = (
  resource: K8sResourceKind,
  props,
): PipelineItem => {
  if (!_.has(props, ['pipelines', 'data'])) return null;
  const pipelinesData = props.pipelines.data;
  const resourceIntanceName = _.get(resource, ['metadata', 'labels', INSTANCE_LABEL], null);
  if (!resourceIntanceName) return null;
  const resourcePipeline = pipelinesData.find(
    (pl) => _.get(pl, ['metadata', 'labels', INSTANCE_LABEL], null) === resourceIntanceName,
  );
  if (!resourcePipeline) return null;
  return {
    pipelines: [resourcePipeline],
    pipelineRuns: getPipelineRunsForPipeline(resourcePipeline, props),
  };
};
