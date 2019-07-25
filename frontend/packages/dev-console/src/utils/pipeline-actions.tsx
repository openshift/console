import * as React from 'react';
import { ALL_NAMESPACES_KEY } from '@console/internal/const';
import { history } from '@console/internal/components/utils';
import { getNamespace } from '@console/internal/components/utils/link';
import { k8sCreate, K8sKind, K8sResourceKind, k8sUpdate } from '@console/internal/module/k8s';
import { errorModal } from '@console/internal/components/modals';
import { PipelineModel, PipelineRunModel } from '../models';
import { Pipeline, PipelineRun } from './pipeline-augment';
import { pipelineRunFilterReducer } from './pipeline-filter-reducer';

interface Action {
  label: string | Record<string, any>;
  callback: () => void;
}

type ActionFunction = (kind: K8sKind, obj: K8sResourceKind) => Action;

const redirectToResourceList = (resource: string) => {
  const url = window.location.pathname;
  const activeNamespace = getNamespace(url);
  const resourceUrl =
    activeNamespace === ALL_NAMESPACES_KEY
      ? `/k8s/all-namespaces/${resource}`
      : `/k8s/ns/${activeNamespace}/${resource}`;
  history.push(resourceUrl);
};

export const newPipelineRun = (pipeline: Pipeline, latestRun: PipelineRun): PipelineRun => {
  if (
    (!pipeline || !pipeline.metadata || !pipeline.metadata.name || !pipeline.metadata.namespace) &&
    (!latestRun ||
      !latestRun.metadata ||
      !latestRun.spec ||
      !latestRun.spec.pipelineRef ||
      !latestRun.spec.pipelineRef.name)
  ) {
    // eslint-disable-next-line no-console
    console.error(
      'Unable to create new PipelineRun. Missing "metadata" in ',
      pipeline,
      ' and spec.pipelineRef in ',
      latestRun,
    );
    return null;
  }
  return {
    apiVersion: `${PipelineRunModel.apiGroup}/${PipelineRunModel.apiVersion}`,
    kind: PipelineRunModel.kind,
    metadata: {
      name:
        pipeline && pipeline.metadata && pipeline.metadata.name
          ? `${pipeline.metadata.name}-${Math.random()
              .toString(36)
              .replace(/[^a-z0-9]+/g, '')
              .substr(1, 6)}`
          : latestRun &&
            latestRun.spec &&
            latestRun.spec.pipelineRef &&
            latestRun.spec.pipelineRef.name
          ? `${latestRun.spec.pipelineRef.name}-${Math.random()
              .toString(36)
              .replace(/[^a-z0-9]+/g, '')
              .substr(1, 6)}`
          : `PipelineRun-${Math.random()
              .toString(36)
              .replace(/[^a-z0-9]+/g, '')
              .substr(1, 6)}`,

      namespace:
        latestRun && latestRun.metadata && latestRun.metadata.namespace
          ? latestRun.metadata.namespace
          : pipeline.metadata.namespace || '',
      labels:
        latestRun && latestRun.metadata && latestRun.metadata.labels
          ? latestRun.metadata.labels
          : {
              'tekton.dev/pipeline': pipeline.metadata.name,
            },
    },
    spec: {
      pipelineRef: {
        name:
          latestRun &&
          latestRun.spec &&
          latestRun.spec.pipelineRef &&
          latestRun.spec.pipelineRef.name
            ? latestRun.spec.pipelineRef.name
            : pipeline && pipeline.metadata && pipeline.metadata.name
            ? pipeline.metadata.name
            : null,
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
    },
  };
};

export const triggerPipeline = (
  pipeline: Pipeline,
  latestRun: PipelineRun,
  redirectURL?: string,
): ActionFunction => {
  // The returned function will be called using the 'kind' and 'obj' in Kebab Actions
  return (): Action => ({
    label: 'Start',
    callback: () => {
      k8sCreate(PipelineRunModel, newPipelineRun(pipeline, latestRun))
        .then(() => {
          if (redirectURL) {
            redirectToResourceList(redirectURL);
          }
        })
        .catch((err) => errorModal({ error: err.message }));
    },
  });
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
        newPipelineRun(
          {
            apiVersion: `${PipelineModel.apiGroup}/${PipelineModel.apiVersion}`,
            kind: 'Pipeline',
            metadata: {
              name: pipelineRun.spec.pipelineRef.name,
            },
          },
          pipelineRun,
        ),
      );
    },
  });
};

export const rerunPipeline = (
  pipeline: Pipeline,
  latestRun: PipelineRun,
  redirectURL?: string,
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
      k8sCreate(PipelineRunModel, newPipelineRun(pipeline, latestRun))
        .then(() => {
          if (redirectURL) {
            redirectToResourceList(redirectURL);
          }
        })
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
      k8sUpdate(PipelineRunModel, pipelineRun, {
        spec: { ...pipelineRun.spec, status: 'PipelineRunCancelled' },
      });
    },
  });
};
