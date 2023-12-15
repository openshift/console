import * as React from 'react';
import i18n from 'i18next';
import * as _ from 'lodash';
import { SemVer } from 'semver';
import { deleteModal, errorModal } from '@console/internal/components/modals';
import {
  history,
  resourcePathFromModel,
  Kebab,
  KebabAction,
  asAccessReview,
} from '@console/internal/components/utils';
import { k8sCreate, K8sKind, k8sPatch, referenceForModel } from '@console/internal/module/k8s';
import { StartedByAnnotation } from '../components/pipelines/const';
import {
  addTriggerModal,
  startPipelineModal,
  removeTriggerModal,
} from '../components/pipelines/modals';
import { getPipelineRunData } from '../components/pipelines/modals/common/utils';
import { getTaskRunsOfPipelineRun } from '../components/taskruns/useTaskRuns';
import { RESOURCE_LOADED_FROM_RESULTS_ANNOTATION } from '../const';
import { EventListenerModel, PipelineModel, PipelineRunModel, TaskRunModel } from '../models';
import { PipelineKind, PipelineRunKind, TaskRunKind } from '../types';
import { shouldHidePipelineRunStop, shouldHidePipelineRunCancel } from './pipeline-augment';
import { getSbomTaskRun, returnValidPipelineRunModel } from './pipeline-utils';

export const handlePipelineRunSubmit = (pipelineRun: PipelineRunKind) => {
  history.push(
    resourcePathFromModel(
      PipelineRunModel,
      pipelineRun.metadata.name,
      pipelineRun.metadata.namespace,
    ),
  );
};

export const triggerPipeline = (
  pipeline: PipelineKind,
  onSubmit?: (pipelineRun: PipelineRunKind) => void,
) => {
  k8sCreate(PipelineRunModel, getPipelineRunData(pipeline))
    .then(onSubmit)
    .catch((err) => errorModal({ error: err.message }));
};

export const reRunPipelineRun: KebabAction = (kind: K8sKind, pipelineRun: PipelineRunKind) => ({
  // t('pipelines-plugin~Rerun')
  labelKey: 'pipelines-plugin~Rerun',
  callback: () => {
    const namespace = _.get(pipelineRun, 'metadata.namespace');
    const { pipelineRef, pipelineSpec } = pipelineRun.spec;
    if (namespace && (pipelineRef?.name || pipelineSpec)) {
      k8sCreate(returnValidPipelineRunModel(pipelineRun), getPipelineRunData(null, pipelineRun));
    } else {
      errorModal({
        error: i18n.t(
          'pipelines-plugin~Invalid PipelineRun configuration, unable to start Pipeline.',
        ),
      });
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

export const editPipeline: KebabAction = (kind: K8sKind, pipeline: PipelineKind) => ({
  // t('pipelines-plugin~Edit Pipeline')
  labelKey: 'pipelines-plugin~Edit Pipeline',
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
  pipeline: PipelineKind,
  onSubmit?: (pipelineRun: PipelineRunKind) => void,
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
  onComplete?: (pipelineRun: PipelineRunKind) => void;
  labelKey?: string;
};
const rerunPipeline: KebabAction = (
  kind: K8sKind,
  pipelineRun: PipelineRunKind,
  resources: any,
  customData: RerunPipelineData = {},
) => {
  // t('pipelines-plugin~Start last run')
  const { labelKey = 'pipelines-plugin~Start last run', onComplete } = customData;

  const sharedProps = { labelKey, accessReview: {} };

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
      k8sCreate(kind, getPipelineRunData(null, pipelineRun))
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

export const rerunPipelineAndStay: KebabAction = (kind: K8sKind, pipelineRun: PipelineRunKind) => {
  return rerunPipeline(kind, pipelineRun);
};

export const rerunPipelineAndRedirect: KebabAction = (
  kind: K8sKind,
  pipelineRun: PipelineRunKind,
) => {
  return rerunPipeline(kind, pipelineRun, null, {
    onComplete: handlePipelineRunSubmit,
    // t('pipelines-plugin~Start last run')
    labelKey: 'pipelines-plugin~Start last run',
  });
};

export const deleteResourceObj: KebabAction = (
  kind: K8sKind,
  resourceObj: PipelineRunKind | TaskRunKind,
) => {
  const tektonResultsFlag =
    resourceObj?.metadata?.annotations?.['results.tekton.dev/log'] ||
    resourceObj?.metadata?.annotations?.['results.tekton.dev/record'] ||
    resourceObj?.metadata?.annotations?.['results.tekton.dev/result'];
  const isResourceLoadedFromTR =
    resourceObj?.metadata?.annotations?.[RESOURCE_LOADED_FROM_RESULTS_ANNOTATION];

  const message = (
    <p>
      {i18n.t(
        'pipelines-plugin~This action will delete resource from k8s but still the resource can be fetched from Tekton Results',
      )}
    </p>
  );
  return {
    // t('pipelines-plugin~Delete {{kind}}', {kind: kind.label})
    labelKey: 'pipelines-plugin~Delete {{kind}}',
    labelKind: { kind: kind.labelKey ? i18n.t(kind.labelKey) : kind.label },
    callback: () =>
      deleteModal({
        kind,
        resource: resourceObj,
        message: !isResourceLoadedFromTR && tektonResultsFlag ? message : '',
      }),
    accessReview: asAccessReview(kind, resourceObj, 'delete'),
    isDisabled: !!isResourceLoadedFromTR,
    tooltip: isResourceLoadedFromTR
      ? i18n.t('pipelines-plugin~Resource is being fetched from Tekton Results.')
      : '',
  };
};

export const rerunPipelineRunAndRedirect: KebabAction = (
  kind: K8sKind,
  pipelineRun: PipelineRunKind,
) => {
  return rerunPipeline(kind, pipelineRun, null, {
    onComplete: handlePipelineRunSubmit,
    // t('pipelines-plugin~Rerun')
    labelKey: 'pipelines-plugin~Rerun',
  });
};

export const stopPipelineRun: KebabAction = (
  kind: K8sKind,
  pipelineRun: PipelineRunKind,
  operatorVersion: SemVer,
  taskRuns: TaskRunKind[],
) => {
  const PLRTasks = getTaskRunsOfPipelineRun(taskRuns, pipelineRun?.metadata?.name);
  // The returned function will be called using the 'kind' and 'obj' in Kebab Actions
  return {
    // t('pipelines-plugin~Stop')
    labelKey: 'pipelines-plugin~Stop',
    // t('pipelines-plugin~Let the running tasks complete, then execute finally tasks'),
    tooltipKey: 'pipelines-plugin~Let the running tasks complete, then execute finally tasks',
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
            value:
              operatorVersion.major === 1 && operatorVersion.minor < 9
                ? 'PipelineRunCancelled'
                : 'StoppedRunFinally',
          },
        ],
      );
    },
    hidden: shouldHidePipelineRunStop(pipelineRun, PLRTasks),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: pipelineRun.metadata.name,
      namespace: pipelineRun.metadata.namespace,
      verb: 'update',
    },
  };
};

export const cancelPipelineRunFinally: KebabAction = (
  kind: K8sKind,
  pipelineRun: PipelineRunKind,
  taskRuns: TaskRunKind[],
) => {
  const PLRTasks = getTaskRunsOfPipelineRun(taskRuns, pipelineRun?.metadata?.name);
  // The returned function will be called using the 'kind' and 'obj' in Kebab Actions
  return {
    // t('pipelines-plugin~Cancel')
    labelKey: 'pipelines-plugin~Cancel',
    // t('pipelines-plugin~Interrupt any executing non finally tasks, then execute finally tasks'),
    tooltipKey:
      'pipelines-plugin~Interrupt any executing non finally tasks, then execute finally tasks',
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
            value: 'CancelledRunFinally',
          },
        ],
      );
    },
    hidden: shouldHidePipelineRunCancel(pipelineRun, PLRTasks),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: pipelineRun.metadata.name,
      namespace: pipelineRun.metadata.namespace,
      verb: 'update',
    },
  };
};

export const viewPipelineRunSBOM: KebabAction = (
  kind: K8sKind,
  pipelineRun: PipelineRunKind,
  taskRuns: TaskRunKind[],
) => {
  const PLRTasks = getTaskRunsOfPipelineRun(taskRuns, pipelineRun?.metadata?.name);
  const sbomTaskRun = getSbomTaskRun(PLRTasks);

  return {
    labelKey: 'pipelines-plugin~View SBOM',
    callback: () => {
      history.push(
        `/k8s/ns/${sbomTaskRun.metadata.namespace}/${referenceForModel(TaskRunModel)}/${
          sbomTaskRun.metadata.name
        }/logs`,
      );
    },
    hidden: !sbomTaskRun,
  };
};

const addTrigger: KebabAction = (kind: K8sKind, pipeline: PipelineKind) => ({
  // t('pipelines-plugin~Add Trigger')
  labelKey: 'pipelines-plugin~Add Trigger',
  callback: () => {
    const cleanPipeline: PipelineKind = {
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

const removeTrigger: KebabAction = (kind: K8sKind, pipeline: PipelineKind) => ({
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
  pipelineRun?: PipelineRunKind,
  isTriggerPresent?: boolean,
): KebabAction[] => [
  (model, resource: PipelineKind) => startPipeline(model, resource, handlePipelineRunSubmit),
  ...(pipelineRun ? [() => rerunPipelineAndRedirect(PipelineRunModel, pipelineRun)] : []),
  (model, pipeline) => addTrigger(EventListenerModel, pipeline),
  ...(isTriggerPresent ? [(model, pipeline) => removeTrigger(EventListenerModel, pipeline)] : []),
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  (model, pipeline) => editPipeline(model, pipeline),
  Kebab.factory.Delete,
];

export const getPipelineRunKebabActions = (
  operatorVersion: SemVer,
  taskRuns: TaskRunKind[],
  redirectReRun?: boolean,
): KebabAction[] => [
  redirectReRun
    ? (model, pipelineRun) => rerunPipelineRunAndRedirect(model, pipelineRun)
    : (model, pipelineRun) => reRunPipelineRun(model, pipelineRun),
  (model, pipelineRun) => stopPipelineRun(model, pipelineRun, operatorVersion, taskRuns),
  (model, pipelineRun) => viewPipelineRunSBOM(model, pipelineRun, taskRuns),
  (model, pipelineRun) => cancelPipelineRunFinally(model, pipelineRun, taskRuns),
  (model, pipelineRun) => deleteResourceObj(model, pipelineRun),
];

export const getTaskRunKebabActions = (): KebabAction[] => [
  (model, taskRun) => deleteResourceObj(model, taskRun),
];
