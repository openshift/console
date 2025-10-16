import { useMemo } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useCommonResourceActions } from '@console/app/src/actions/hooks/useCommonResourceActions';
import { Action, useK8sModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { errorModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { k8sCreate, referenceFor } from '@console/internal/module/k8s';
import { StartedByAnnotation } from '../components/pipelines/const';
import {
  addTriggerModal,
  removeTriggerModal,
  startPipelineModal,
} from '../components/pipelines/modals';
import { getPipelineRunData } from '../components/pipelines/modals/common/utils';
import { usePipelineTriggerTemplateNames } from '../components/pipelines/utils/triggers';
import { EventListenerModel, PipelineRunModel } from '../models';
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
  const pipelineRun = pipeline?.latestRun;
  const factory = useMemo(
    () => ({
      startLastRun: () => ({
        id: 'start-last-run',
        label: t('pipelines-plugin~Start last run'),
        cta: () => {
          k8sCreate(PipelineRunModel, getPipelineRunData(null, pipelineRun))
            .then(handlePipelineRunSubmit)
            .catch((err) => errorModal({ error: err.message }));
        },
      }),
    }),
    [t, pipelineRun],
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

export const usePipelineActionsProvider = (
  resource: PipelineWithLatest,
): [Action[], boolean, boolean] => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const commonActions = useCommonResourceActions(kindObj, resource);
  const startPipelineAction = useStartPipelineAction(resource);
  const startLastRunAction = useStartLastRunAction(resource);
  const addTriggerAction = useAddTriggerAction(resource);
  const removeTriggerAction = useRemoveTriggerAction(resource);
  const actions = useMemo(
    () => [
      ...startPipelineAction,
      ...startLastRunAction,
      ...addTriggerAction,
      ...removeTriggerAction,
      ...commonActions,
    ],
    [commonActions, startPipelineAction, startLastRunAction, addTriggerAction, removeTriggerAction],
  );
  return [actions, !inFlight, false];
};
