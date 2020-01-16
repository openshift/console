import * as React from 'react';
import * as _ from 'lodash';
import { ALL_NAMESPACES_KEY } from '@console/internal/const';
import { history } from '@console/internal/components/utils';
import { getNamespace } from '@console/internal/components/utils/link';
import { k8sCreate, K8sKind, K8sResourceKind, k8sUpdate } from '@console/internal/module/k8s';
import { errorModal } from '@console/internal/components/modals';
import { PipelineModel, PipelineRunModel } from '../models';
import startPipelineModal from '../components/pipelines/pipeline-form/StartPipelineModal';
import { getRandomChars } from '../components/pipelines/pipeline-resource/pipelineResource-utils';
import { Pipeline, PipelineParam, PipelineRun, PipelineRunParam } from './pipeline-augment';
import { pipelineRunFilterReducer } from './pipeline-filter-reducer';
import { getPipelineRunParams } from './pipeline-utils';

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
export const handlePipelineRunSubmit = (pipelineRun: PipelineRun) => {
  redirectToResourceList(`pipelineruns/${pipelineRun.metadata.name}`);
};

/**
 * Migrates a PipelineRun from one version to another to support auto-upgrades with old (and invalid) PipelineRuns.
 *
 * Note: Each check within this method should be driven by the apiVersion number if the API is properly up-versioned
 * for these breaking changes. (should be done moving from 0.10.x forward)
 */
export const migratePipelineRun = (pipelineRun: PipelineRun): PipelineRun => {
  let newPipelineRun = pipelineRun;

  const serviceAccountPath = 'spec.serviceAccount';
  if (_.has(newPipelineRun, serviceAccountPath)) {
    // .spec.serviceAccount was removed for .spec.serviceAccountName in 0.9.x
    // Note: apiVersion was not updated for this change and thus we cannot gate this change behind a version number
    const serviceAccountName = _.get(newPipelineRun, serviceAccountPath);
    newPipelineRun = _.omit(newPipelineRun, [serviceAccountPath]);
    newPipelineRun = _.merge(newPipelineRun, {
      spec: {
        serviceAccountName,
      },
    });
  }

  return newPipelineRun;
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

  const pipelineRunParams: PipelineRunParam[] = _.get(latestRun, 'spec.params');
  const pipelineParams: PipelineParam[] = _.get(pipeline, 'spec.params');

  const newPipelineRun: PipelineRun = {
    apiVersion: pipeline ? pipeline.apiVersion : latestRun.apiVersion,
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
      ..._.get(latestRun, 'spec', {}),
      pipelineRef: {
        name: pipeline.metadata.name,
      },
      resources,
      params: pipelineRunParams || getPipelineRunParams(pipelineParams),
    },
  };

  return migratePipelineRun(newPipelineRun);
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
