import * as _ from 'lodash';
import {
  history,
  resourcePathFromModel,
  Kebab,
  KebabAction,
} from '@console/internal/components/utils';
import { k8sCreate, K8sKind, k8sPatch, referenceForModel } from '@console/internal/module/k8s';
import { errorModal } from '@console/internal/components/modals';
import {
  addTriggerModal,
  startPipelineModal,
  removeTriggerModal,
} from '../components/pipelines/modals';
import { getPipelineRunData } from '../components/pipelines/modals/common/utils';
import { StartedByAnnotation } from '../components/pipelines/const';
import { EventListenerModel, PipelineModel, PipelineRunModel } from '../models';
import { Pipeline, PipelineRun } from './pipeline-augment';
import { pipelineRunFilterReducer } from './pipeline-filter-reducer';
import { hasInlineTaskSpec } from './pipeline-utils';

export const handlePipelineRunSubmit = (pipelineRun: PipelineRun) => {
  history.push(
    resourcePathFromModel(
      PipelineRunModel,
      pipelineRun.metadata.name,
      pipelineRun.metadata.namespace,
    ),
  );
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
  // t('pipelines-plugin~Rerun')
  labelKey: 'pipelines-plugin~Rerun',
  callback: () => {
    const namespace = _.get(pipelineRun, 'metadata.namespace');
    const { pipelineRef, pipelineSpec } = pipelineRun.spec;
    if (namespace && (pipelineRef?.name || pipelineSpec)) {
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
  // t('pipelines-plugin~Edit Pipeline')
  labelKey: 'pipelines-plugin~Edit Pipeline',
  hidden: hasInlineTaskSpec(pipeline.spec.tasks),
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
  // t('pipelines-plugin~Start')
  labelKey: 'pipelines-plugin~Start',
  callback: () => {
    const params = _.get(pipeline, ['spec', 'params'], []);
    const resources = _.get(pipeline, ['spec', 'resources'], []);
    const workspaces = _.get(pipeline, ['spec', 'workspaces'], []);

    if (!_.isEmpty(params) || !_.isEmpty(resources) || !_.isEmpty(workspaces)) {
      startPipelineModal({
        pipeline,
        modalClassName: 'modal-lg',
        onSubmit,
      });
    } else {
      triggerPipeline(pipeline, onSubmit);
    }
  },
  accessReview: {
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    namespace: pipeline.metadata.namespace,
    verb: 'create',
  },
});

type RerunPipelineData = {
  onComplete?: (pipelineRun: PipelineRun) => void;
  labelKey?: string;
};
const rerunPipeline: KebabAction = (
  kind: K8sKind,
  pipelineRun: PipelineRun,
  resources: any,
  customData: RerunPipelineData = { labelKey: 'Start Last Run' },
) => {
  const { onComplete } = customData;

  const sharedProps = { labelKey: customData.labelKey, accessReview: {} };

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
    // t('pipelines-plugin~Start last run')
    labelKey: 'pipelines-plugin~Start last run',
  });
};

export const rerunPipelineRunAndRedirect: KebabAction = (
  kind: K8sKind,
  pipelineRun: PipelineRun,
) => {
  return rerunPipeline(kind, pipelineRun, null, {
    onComplete: handlePipelineRunSubmit,
    // t('pipelines-plugin~Rerun')
    labelKey: 'pipelines-plugin~Rerun',
  });
};

export const stopPipelineRun: KebabAction = (kind: K8sKind, pipelineRun: PipelineRun) => {
  // The returned function will be called using the 'kind' and 'obj' in Kebab Actions
  return {
    // t('pipelines-plugin~Stop')
    labelKey: 'pipelines-plugin~Stop',
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

const addTrigger: KebabAction = (kind: K8sKind, pipeline: Pipeline) => ({
  // t('pipelines-plugin~Add Trigger')
  labelKey: 'pipelines-plugin~Add Trigger',
  callback: () => {
    const cleanPipeline: Pipeline = {
      ...pipeline,
      metadata: {
        ...pipeline.metadata,
        annotations: _.omit(pipeline.metadata.annotations, [StartedByAnnotation.user]),
      },
    };
    addTriggerModal({ pipeline: cleanPipeline, modalClassName: 'modal-lg' });
  },
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: pipeline.metadata.name,
    namespace: pipeline.metadata.namespace,
    verb: 'create',
  },
});

const removeTrigger: KebabAction = (kind: K8sKind, pipeline: Pipeline) => ({
  // t('pipelines-plugin~Remove Trigger')
  labelKey: 'pipelines-plugin~Remove Trigger',
  callback: () => {
    removeTriggerModal({ pipeline });
  },
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: pipeline.metadata.name,
    namespace: pipeline.metadata.namespace,
    verb: 'delete',
  },
});
export const getPipelineKebabActions = (
  pipelineRun?: PipelineRun,
  isTriggerPresent?: boolean,
): KebabAction[] => [
  (model, resource: Pipeline) => startPipeline(model, resource, handlePipelineRunSubmit),
  ...(pipelineRun ? [() => rerunPipelineAndRedirect(PipelineRunModel, pipelineRun)] : []),
  (model, pipeline) => addTrigger(EventListenerModel, pipeline),
  ...(isTriggerPresent ? [(model, pipeline) => removeTrigger(EventListenerModel, pipeline)] : []),
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  (model, pipeline) => editPipeline(model, pipeline),
  Kebab.factory.Delete,
];

export const getPipelineRunKebabActions = (redirectReRun?: boolean): KebabAction[] => [
  redirectReRun
    ? (model, pipelineRun) => rerunPipelineRunAndRedirect(model, pipelineRun)
    : (model, pipelineRun) => reRunPipelineRun(model, pipelineRun),
  (model, pipelineRun) => stopPipelineRun(model, pipelineRun),
  Kebab.factory.Delete,
];

export const getTaskRunKebabActions = (): KebabAction[] => [Kebab.factory.Delete];
