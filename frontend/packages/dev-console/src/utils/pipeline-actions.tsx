import * as _ from 'lodash';
import { history, resourcePathFromModel, KebabAction } from '@console/internal/components/utils';
import { k8sCreate, K8sKind, k8sUpdate } from '@console/internal/module/k8s';
import { errorModal } from '@console/internal/components/modals';
import { PipelineModel, PipelineRunModel } from '../models';
import startPipelineModal from '../components/pipelines/pipeline-form/StartPipelineModal';
import { getRandomChars } from '../components/pipelines/pipeline-resource/pipelineResource-utils';
import { Pipeline, PipelineRun } from './pipeline-augment';

export const handlePipelineRunSubmit = (pipelineRun: PipelineRun) => {
  history.push(
    resourcePathFromModel(
      PipelineRunModel,
      pipelineRun.metadata.name,
      pipelineRun.metadata.namespace,
    ),
  );
};
export const getPipelineRunData = (pipeline: Pipeline, latestRun?: PipelineRun): PipelineRun => {
  if (!pipeline || !pipeline.metadata || !pipeline.metadata.name || !pipeline.metadata.namespace) {
    // eslint-disable-next-line no-console
    console.error('Unable to create new PipelineRun. Missing "metadata" in ', pipeline);
    return null;
  }

  // Only pass fields name and resourceRef for backend validation
  // Not to use the pipeline spec resource as fallback as it would fail validation
  const runResources = _.get(latestRun, ['spec', 'resources'], []);
  const resources = runResources.map((resource) => ({
    name: resource.name,
    resourceRef: resource.resourceRef,
  }));

  return {
    apiVersion: `${PipelineRunModel.apiGroup}/${PipelineRunModel.apiVersion}`,
    kind: PipelineRunModel.kind,
    metadata: {
      name: `${pipeline.metadata.name}-${getRandomChars(6)}`,
      namespace: pipeline.metadata.namespace,
      labels:
        latestRun && latestRun.metadata && latestRun.metadata.labels
          ? latestRun.metadata.labels
          : {
              'tekton.dev/pipeline': pipeline.metadata.name,
            },
    },
    spec: {
      pipelineRef: {
        name: pipeline.metadata.name,
      },
      resources,
      params:
        latestRun && latestRun.spec && latestRun.spec.params
          ? latestRun.spec.params
          : pipeline.spec && pipeline.spec.params
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
    k8sCreate(
      PipelineRunModel,
      getPipelineRunData(
        {
          apiVersion: `${PipelineModel.apiGroup}/${PipelineModel.apiVersion}`,
          kind: 'Pipeline',
          metadata: {
            name: pipelineRun.spec.pipelineRef.name,
            namespace: pipelineRun.metadata.namespace,
          },
        },
        pipelineRun,
      ),
    );
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

export const rerunPipeline: KebabAction = (
  kind: K8sKind,
  pipeline: Pipeline,
  latestRun: PipelineRun,
  onSubmit?: (pipelineRun: PipelineRun) => void,
) => {
  // The returned function will be called using the 'kind' and 'obj' in Kebab Actions
  return {
    label: 'Start Last Run',
    callback: () => {
      k8sCreate(PipelineRunModel, getPipelineRunData(pipeline, latestRun))
        .then(onSubmit)
        .catch((err) => errorModal({ error: err.message }));
    },
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: pipeline.metadata.name,
      namespace: pipeline.metadata.namespace,
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
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: pipelineRun.metadata.name,
      namespace: pipelineRun.metadata.namespace,
      verb: 'update',
    },
  };
};
