import * as _ from 'lodash';
import { history, resourcePathFromModel, KebabAction } from '@console/internal/components/utils';
import { k8sCreate, K8sKind, k8sPatch, referenceForModel } from '@console/internal/module/k8s';
import { errorModal } from '@console/internal/components/modals';
import { getRandomChars } from '@console/shared/src/utils';
import { PipelineModel, PipelineRunModel } from '../models';
import startPipelineModal from '../components/pipelines/pipeline-form/StartPipelineModal';
import { Pipeline, PipelineRun } from './pipeline-augment';
import { pipelineRunFilterReducer } from './pipeline-filter-reducer';
import { getPipelineRunParams } from './pipeline-utils';

export const handlePipelineRunSubmit = (pipelineRun: PipelineRun) => {
  history.push(
    resourcePathFromModel(
      PipelineRunModel,
      pipelineRun.metadata.name,
      pipelineRun.metadata.namespace,
    ),
  );
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

  const latestRunParams = _.get(latestRun, 'spec.params');
  const pipelineParams = _.get(pipeline, 'spec.params');

  const params = latestRunParams || getPipelineRunParams(pipelineParams);

  const workspaces = _.get(latestRun, ['spec', 'workspaces']);

  const newPipelineRun = {
    apiVersion: pipeline ? pipeline.apiVersion : latestRun.apiVersion,
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
      ..._.get(latestRun, 'spec', {}),
      pipelineRef: {
        name: pipelineName,
      },
      resources,
      ...(params && { params }),
      workspaces,
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

export const reRunPipelineRun: KebabAction = (kind: K8sKind, pipelineRun: PipelineRun) => ({
  label: 'Rerun',
  callback: () => {
    const namespace = _.get(pipelineRun, 'metadata.namespace');
    const pipelineRef = _.get(pipelineRun, 'spec.pipelineRef.name');
    if (namespace && pipelineRef) {
      k8sCreate(PipelineRunModel, getPipelineRunData(null, pipelineRun));
    } else {
      errorModal({ error: 'Invalid Pipeline Run configuration, unable to start Pipeline.' });
    }
  },
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: pipelineRun.metadata.name,
    namespace: pipelineRun.metadata.namespace,
    verb: 'create',
  },
});

export const editPipeline: KebabAction = (kind: K8sKind, pipeline: Pipeline) => ({
  label: 'Edit Pipeline',
  callback: () => {
    const {
      metadata: { name, namespace },
    } = pipeline;
    history.push(`/k8s/ns/${namespace}/${referenceForModel(PipelineModel)}/${name}/builder`);
  },
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: pipeline.metadata.name,
    namespace: pipeline.metadata.namespace,
    verb: 'update',
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
    const workspaces = _.get(pipeline, ['spec', 'workspaces'], []);

    if (!_.isEmpty(params) || !_.isEmpty(resources) || !_.isEmpty(workspaces)) {
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

type RerunPipelineData = {
  onComplete?: (pipelineRun: PipelineRun) => void;
  label?: string;
};
const rerunPipeline: KebabAction = (
  kind: K8sKind,
  pipelineRun: PipelineRun,
  resources: any,
  customData: RerunPipelineData = { label: 'Start Last Run' },
) => {
  const { onComplete } = customData;

  const sharedProps = { label: customData.label, accessReview: {} };

  if (
    !pipelineRun ||
    !_.has(pipelineRun, 'metadata.name') ||
    !_.has(pipelineRun, 'metadata.namespace')
  ) {
    return sharedProps;
  }

  return {
    ...sharedProps,
    callback: () => {
      k8sCreate(PipelineRunModel, getPipelineRunData(null, pipelineRun))
        .then(typeof onComplete === 'function' ? onComplete : () => {})
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

export const rerunPipelineAndStay: KebabAction = (kind: K8sKind, pipelineRun: PipelineRun) => {
  return rerunPipeline(kind, pipelineRun);
};

export const rerunPipelineAndRedirect: KebabAction = (kind: K8sKind, pipelineRun: PipelineRun) => {
  return rerunPipeline(kind, pipelineRun, null, {
    onComplete: handlePipelineRunSubmit,
    label: 'Start Last Run',
  });
};

export const rerunPipelineRunAndRedirect: KebabAction = (
  kind: K8sKind,
  pipelineRun: PipelineRun,
) => {
  return rerunPipeline(kind, pipelineRun, null, {
    onComplete: handlePipelineRunSubmit,
    label: 'Rerun',
  });
};

export const stopPipelineRun: KebabAction = (kind: K8sKind, pipelineRun: PipelineRun) => {
  // The returned function will be called using the 'kind' and 'obj' in Kebab Actions
  return {
    label: 'Stop',
    callback: () => {
      k8sPatch(
        PipelineRunModel,
        {
          metadata: { name: pipelineRun.metadata.name, namespace: pipelineRun.metadata.namespace },
        },
        [
          {
            op: 'replace',
            path: `/spec/status`,
            value: 'PipelineRunCancelled',
          },
        ],
      );
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
