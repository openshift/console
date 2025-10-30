import { useMemo } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { CommonActionCreator } from '@console/app/src/actions/hooks/types';
import { useCommonActions } from '@console/app/src/actions/hooks/useCommonActions';
import { Action, useK8sModel, useOverlay } from '@console/dynamic-plugin-sdk/src/lib-core';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import { asAccessReview } from '@console/internal/components/utils';
import { k8sCreate, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { StartedByAnnotation } from '../components/pipelines/const';
import {
  addTriggerModal,
  removeTriggerModal,
  startPipelineModal,
} from '../components/pipelines/modals';
import { getPipelineRunData } from '../components/pipelines/modals/common/utils';
import { usePipelineTriggerTemplateNames } from '../components/pipelines/utils/triggers';
import { EventListenerModel, PipelineModel, PipelineRunModel } from '../models';
import { PipelineKind, PipelineWithLatest } from '../types';
import { handlePipelineRunSubmit, triggerPipeline } from './pipeline-actions';

const useStartPipelineAction = (pipeline: PipelineKind): Action[] => {
  const { t } = useTranslation();
  const factory = useMemo(
    () => ({
      startPipeline: () => ({
        id: 'start-pipeline',
        label: t('pipelines-plugin~Start'),
        cta: () => {
          const params = _.get(pipeline, ['spec', 'params'], []);
          const resources = _.get(pipeline, ['spec', 'resources'], []);
          const workspaces = _.get(pipeline, ['spec', 'workspaces'], []);

          if (!_.isEmpty(params) || !_.isEmpty(resources) || !_.isEmpty(workspaces)) {
            startPipelineModal({
              pipeline,
              modalClassName: 'modal-lg',
              onSubmit: handlePipelineRunSubmit,
            });
          } else {
            triggerPipeline(pipeline, handlePipelineRunSubmit);
          }
        },
        accessReview: asAccessReview(PipelineRunModel, pipeline, 'create'),
      }),
    }),
    [pipeline, t],
  );
  const action = useMemo<Action[]>(() => [factory.startPipeline()], [factory]);
  return action;
};

const useStartLastRunAction = (pipeline: PipelineWithLatest): Action[] => {
  const { t } = useTranslation();
  const launchModal = useOverlay();
  const pipelineRun = pipeline?.latestRun;
  const factory = useMemo(
    () => ({
      startLastRun: () => ({
        id: 'start-last-run',
        label: t('pipelines-plugin~Start last run'),
        cta: () => {
          k8sCreate(PipelineRunModel, getPipelineRunData(null, pipelineRun))
            .then(handlePipelineRunSubmit)
            .catch((err) => launchModal(ErrorModal, { error: err.message }));
        },
      }),
    }),
    [t, pipelineRun, launchModal],
  );
  const action = useMemo<Action[]>(() => (pipelineRun ? [factory.startLastRun()] : []), [
    factory,
    pipelineRun,
  ]);
  return action;
};

const useAddTriggerAction = (pipeline: PipelineKind): Action[] => {
  const { t } = useTranslation();
  const factory = useMemo(
    () => ({
      addTrigger: () => ({
        id: 'add-trigger',
        label: t('pipelines-plugin~Add Trigger'),
        cta: () => {
          const cleanPipeline: PipelineKind = {
            ...pipeline,
            metadata: {
              ...pipeline.metadata,
              annotations: _.omit(pipeline.metadata.annotations, [StartedByAnnotation.user]),
            },
          };
          addTriggerModal({ pipeline: cleanPipeline, modalClassName: 'modal-lg' });
        },
        accessReview: asAccessReview(EventListenerModel, pipeline, 'create'),
      }),
    }),
    [t, pipeline],
  );
  const action = useMemo<Action[]>(() => [factory.addTrigger()], [factory]);
  return action;
};

const useRemoveTriggerAction = (pipeline: PipelineKind): Action[] => {
  const { t } = useTranslation();
  const templateNamesResult = usePipelineTriggerTemplateNames(
    pipeline?.metadata.name,
    pipeline?.metadata.namespace,
  );

  // Only memoize based on length to avoid array reference issues
  const hasTemplates = templateNamesResult ? templateNamesResult.length > 0 : false;

  const factory = useMemo(
    () => ({
      removeTrigger: () => ({
        id: 'remove-trigger',
        label: t('pipelines-plugin~Remove Trigger'),
        cta: () => {
          removeTriggerModal({ pipeline });
        },
        accessReview: asAccessReview(EventListenerModel, pipeline, 'delete'),
      }),
    }),
    [t, pipeline],
  );

  const action = useMemo<Action[]>(() => (hasTemplates ? [factory.removeTrigger()] : []), [
    factory,
    hasTemplates,
  ]);

  return action;
};

const useEditPipelineAction = (pipeline: PipelineKind): Action[] => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    metadata: { name, namespace },
  } = pipeline;
  const factory = useMemo(
    () => ({
      editPipeline: () => ({
        id: 'edit-pipeline',
        label: t('pipelines-plugin~Edit Pipeline'),
        cta: () => {
          navigate(`/k8s/ns/${namespace}/${referenceForModel(PipelineModel)}/${name}/builder`);
        },
        accessReview: asAccessReview(PipelineModel, pipeline, 'update'),
      }),
    }),
    [t, pipeline, navigate, namespace, name],
  );
  const action = useMemo<Action[]>(() => [factory.editPipeline()], [factory]);
  return action;
};

export const usePipelineActionsProvider = (
  resource: PipelineWithLatest,
): [Action[], boolean, boolean] => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const startPipelineAction = useStartPipelineAction(resource);
  const startLastRunAction = useStartLastRunAction(resource);
  const addTriggerAction = useAddTriggerAction(resource);
  const removeTriggerAction = useRemoveTriggerAction(resource);
  const editPipelineAction = useEditPipelineAction(resource);
  const [actions1, isReady] = useCommonActions(kindObj, resource, [
    CommonActionCreator.ModifyLabels,
    CommonActionCreator.ModifyAnnotations,
  ] as const);
  const [actions2, isReady2] = useCommonActions(kindObj, resource, [
    CommonActionCreator.Delete,
  ] as const);
  const commonActions1 = useMemo(() => (isReady ? Object.values(actions1) : []), [
    actions1,
    isReady,
  ]);
  const commonActions2 = useMemo(() => (isReady2 ? Object.values(actions2) : []), [
    actions2,
    isReady2,
  ]);
  const actions = useMemo(
    () => [
      ...startPipelineAction,
      ...startLastRunAction,
      ...addTriggerAction,
      ...removeTriggerAction,
      ...commonActions1,
      ...editPipelineAction,
      ...commonActions2,
    ],
    [
      commonActions1,
      commonActions2,
      startPipelineAction,
      startLastRunAction,
      addTriggerAction,
      removeTriggerAction,
      editPipelineAction,
    ],
  );
  return [actions, !inFlight, false];
};
