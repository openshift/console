import * as React from 'react';
import * as _ from 'lodash';
import { history, resourcePathFromModel } from '@console/internal/components/utils';
import { k8sCreate, K8sKind, K8sResourceKind, k8sUpdate } from '@console/internal/module/k8s';
import { errorModal } from '@console/internal/components/modals';
import { PipelineModel, PipelineRunModel } from '../models';
import startPipelineModal from '../components/pipelines/pipeline-form/StartPipelineModal';
import { getRandomChars } from '../components/pipelines/pipeline-resource/pipelineResource-utils';
import { Pipeline, PipelineRun } from './pipeline-augment';
import { pipelineRunFilterReducer } from './pipeline-filter-reducer';

interface Action {
  label: string | Record<string, any>;
  callback: () => void;
}

type ActionFunction = (kind: K8sKind, obj: K8sResourceKind) => Action;

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
  // TODO: Add serviceAccount for start scenario by fetching details from user
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
      resources:
        latestRun && latestRun.spec && latestRun.spec.resources
          ? latestRun.spec.resources
          : pipeline && pipeline.spec && pipeline.spec.resources
          ? pipeline.spec.resources
          : [],
      params:
        latestRun && latestRun.spec && latestRun.spec.params
          ? latestRun.spec.params
          : pipeline.spec && pipeline.spec.params
          ? pipeline.spec.params
          : null,
      trigger: {
        type: 'manual',
      },
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

export const reRunPipelineRun = (pipelineRun: PipelineRun): ActionFunction => {
  // The returned function will be called using the 'kind' and 'obj' in Kebab Actions
  return (): Action => ({
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
  });
};
export const startPipeline = (
  pipeline: Pipeline,
  onSubmit?: (pipelineRun: PipelineRun) => void,
) => (): Action => ({
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
});
export const rerunPipeline = (
  pipeline: Pipeline,
  latestRun: PipelineRun,
  onSubmit?: (pipelineRun: PipelineRun) => void,
): ActionFunction => {
  if (!latestRun || !latestRun.metadata) {
    // The returned function will be called using the 'kind' and 'obj' in Kebab Actions
    return (): Action => ({
      label: <div className="dropdown__disabled">Start Last Run</div>,
      callback: null,
    });
  }
  // The returned function will be called using the 'kind' and 'obj' in Kebab Actions
  return (): Action => ({
    label: 'Start Last Run',
    callback: () => {
      k8sCreate(PipelineRunModel, getPipelineRunData(pipeline, latestRun))
        .then(onSubmit)
        .catch((err) => errorModal({ error: err.message }));
    },
  });
};

export const stopPipelineRun = (pipelineRun: PipelineRun): ActionFunction => {
  if (!pipelineRun || pipelineRunFilterReducer(pipelineRun) !== 'Running') {
    // The returned function will be called using the 'kind' and 'obj' in Kebab Actions
    return (): Action => ({
      label: <div className="dropdown__disabled">Stop</div>,
      callback: null,
    });
  }
  // The returned function will be called using the 'kind' and 'obj' in Kebab Actions
  return (): Action => ({
    label: 'Stop',
    callback: () => {
      k8sUpdate(PipelineRunModel, {
        ...pipelineRun,
        spec: { ...pipelineRun.spec, status: 'PipelineRunCancelled' },
      });
    },
  });
};
