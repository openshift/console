import * as _ from 'lodash';
import { history, resourcePathFromModel, KebabAction } from '@console/internal/components/utils';
import { k8sCreate, K8sKind, k8sUpdate } from '@console/internal/module/k8s';
import { errorModal } from '@console/internal/components/modals';
import { PipelineRunModel } from '../models';
import startPipelineModal from '../components/pipelines/pipeline-form/StartPipelineModal';
import { getRandomChars } from '../components/pipelines/pipeline-resource/pipelineResource-utils';
import { Pipeline, PipelineRun } from './pipeline-augment';
import { pipelineRunFilterReducer } from './pipeline-filter-reducer';

export const handlePipelineRunSubmit = (pipelineRun: PipelineRun) => {
  history.push(
    resourcePathFromModel(
      PipelineRunModel,
      pipelineRun.metadata.name,
      pipelineRun.metadata.namespace,
    ),
  );
};
export const getPipelineRunData = (
  pipeline: Pipeline = null,
  latestRun?: PipelineRun,
): PipelineRun => {
  if (!pipeline && !latestRun) {
    // eslint-disable-next-line no-console
    console.error('Missing parameters, unable to create new PipelineRun');
    return null;
  }

  // Only pass fields name and resourceRef for backend validation
  // Not to use the pipeline spec resource as fallback as it would fail validation
  const runResources = _.get(latestRun, ['spec', 'resources'], []);
  const resources = runResources.map((resource) => ({
    name: resource.name,
    resourceRef: resource.resourceRef,
  }));

  const pipelineName = pipeline ? pipeline.metadata.name : latestRun.spec.pipelineRef.name;

  return {
    apiVersion: `${PipelineRunModel.apiGroup}/${PipelineRunModel.apiVersion}`,
    kind: PipelineRunModel.kind,
    metadata: {
      name: `${pipelineName}-${getRandomChars(6)}`,
      namespace: pipeline ? pipeline.metadata.namespace : latestRun.metadata.namespace,
      labels:
        latestRun && latestRun.metadata && latestRun.metadata.labels
          ? latestRun.metadata.labels
          : {
              'tekton.dev/pipeline': pipelineName,
            },
    },
    spec: {
      pipelineRef: {
        name: pipelineName,
      },
      resources,
      params:
        latestRun && latestRun.spec && latestRun.spec.params
          ? latestRun.spec.params
          : pipeline && pipeline.spec && pipeline.spec.params
          ? pipeline.spec.params
          : null,
      serviceAccount: latestRun && _.get(latestRun, ['spec', 'serviceAccount']),
    },
  };
};

export const triggerPipeline = (
  pipeline: Pipeline,
  onSubmit?: (pipelineRun: PipelineRun) => void,
) => {
  k8sCreate(PipelineRunModel, getPipelineRunData(pipeline))
    .then(onSubmit)
    .catch((err) => errorModal({ error: err.message }));
};

export const reRunPipelineRun: KebabAction = (kind: K8sKind, pipelineRun: PipelineRun) => ({
  label: 'Rerun',
  callback: () => {
    if (
      !pipelineRun ||
      !pipelineRun.metadata ||
      !pipelineRun.metadata.namespace ||
      !pipelineRun.spec ||
      !pipelineRun.spec.pipelineRef ||
      !pipelineRun.spec.pipelineRef.name
    ) {
      // eslint-disable-next-line no-console
      console.error('Improper PipelineRun metadata');
      return;
    }
    k8sCreate(PipelineRunModel, getPipelineRunData(null, pipelineRun));
  },
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: pipelineRun.metadata.name,
    namespace: pipelineRun.metadata.namespace,
    verb: 'create',
  },
});

export const startPipeline: KebabAction = (
  kind: K8sKind,
  pipeline: Pipeline,
  onSubmit?: (pipelineRun: PipelineRun) => void,
) => ({
  label: 'Start',
  callback: () => {
    const params = _.get(pipeline, ['spec', 'params'], []);
    const resources = _.get(pipeline, ['spec', 'resources'], []);

    if (!_.isEmpty(params) || !_.isEmpty(resources)) {
      startPipelineModal({
        pipeline,
        getPipelineRunData,
        modalClassName: 'modal-lg',
        onSubmit,
      });
    } else {
      triggerPipeline(pipeline, onSubmit);
    }
  },
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: pipeline.metadata.name,
    namespace: pipeline.metadata.namespace,
    verb: 'create',
  },
});

export const rerunPipeline: KebabAction = (kind: K8sKind, pipelineRun: PipelineRun) => {
  // The returned function will be called using the 'kind' and 'obj' in Kebab Actions
  return {
    label: 'Start Last Run',
    callback: () => {
      k8sCreate(PipelineRunModel, getPipelineRunData(null, pipelineRun))
        .then(handlePipelineRunSubmit)
        .catch((err) => errorModal({ error: err.message }));
    },
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: pipelineRun.metadata.name,
      namespace: pipelineRun.metadata.namespace,
      verb: 'create',
    },
  };
};

export const stopPipelineRun: KebabAction = (kind: K8sKind, pipelineRun: PipelineRun) => {
  // The returned function will be called using the 'kind' and 'obj' in Kebab Actions
  return {
    label: 'Stop',
    callback: () => {
      k8sUpdate(PipelineRunModel, {
        ...pipelineRun,
        spec: { ...pipelineRun.spec, status: 'PipelineRunCancelled' },
      });
    },
    hidden: !(pipelineRun && pipelineRunFilterReducer(pipelineRun) === 'Running'),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: pipelineRun.metadata.name,
      namespace: pipelineRun.metadata.namespace,
      verb: 'update',
    },
  };
};
