import { useMemo } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Action, K8sResourceKind, useOverlay } from '@console/dynamic-plugin-sdk/src/lib-core';
import { DeleteOverlay } from '@console/internal/components/modals/delete-modal';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { k8sCreate, k8sPatch } from '@console/internal/module/k8s';
import { getPipelineRunData } from '../components/pipelines/modals/common/utils';
import { getTaskRunsOfPipelineRun } from '../components/taskruns/useTaskRuns';
import { RESOURCE_LOADED_FROM_RESULTS_ANNOTATION } from '../const';
import { PipelineRunModel } from '../models/pipelines';
import { PipelineRunKind, TaskRunKind } from '../types';
import { handlePipelineRunSubmit } from './pipeline-actions';
import {
  shouldHidePipelineRunCancel,
  shouldHidePipelineRunCancelForTaskRunStatus,
  shouldHidePipelineRunStop,
  shouldHidePipelineRunStopForTaskRunStatus,
  TaskStatus,
} from './pipeline-augment';

const useStopPipelineRunAction = (
  pipelineRun: PipelineRunKind,
  taskRuns: TaskRunKind[],
  taskRunStatusObj?: TaskStatus,
): Action[] => {
  const { t } = useTranslation();
  const PLRTasks = getTaskRunsOfPipelineRun(taskRuns, pipelineRun?.metadata?.name);
  const hideAction = taskRunStatusObj
    ? shouldHidePipelineRunStopForTaskRunStatus(pipelineRun, taskRunStatusObj)
    : shouldHidePipelineRunStop(pipelineRun, PLRTasks);
  const factory = useMemo(
    () => ({
      stopPipelineRun: () => ({
        id: 'stop-pipeline-run',
        label: t('pipelines-plugin~Stop'),
        cta: () => {
          k8sPatch(
            PipelineRunModel,
            {
              metadata: {
                name: pipelineRun.metadata.name,
                namespace: pipelineRun.metadata.namespace,
              },
            },
            [
              {
                op: 'replace',
                path: `/spec/status`,
                value: 'StoppedRunFinally',
              },
            ],
          );
        },
        accessReview: asAccessReview(PipelineRunModel, pipelineRun, 'update'),
      }),
    }),
    [t, pipelineRun],
  );
  const action = useMemo<Action[]>(() => (!hideAction ? [factory.stopPipelineRun()] : []), [
    factory,
    hideAction,
  ]);
  return action;
};

const useCancelPipelineRunFinallyAction = (
  pipelineRun: PipelineRunKind,
  taskRuns: TaskRunKind[],
  taskRunStatusObj?: TaskStatus,
): Action[] => {
  const { t } = useTranslation();
  const PLRTasks = getTaskRunsOfPipelineRun(taskRuns, pipelineRun?.metadata?.name);
  const hideAction = taskRunStatusObj
    ? shouldHidePipelineRunCancelForTaskRunStatus(pipelineRun, taskRunStatusObj)
    : shouldHidePipelineRunCancel(pipelineRun, PLRTasks);
  const factory = useMemo(
    () => ({
      cancelPipelineRunFinally: () => ({
        id: 'cancel-pipeline-run-finally',
        label: t('pipelines-plugin~Cancel'),
        cta: () => {
          k8sPatch(
            PipelineRunModel,
            {
              metadata: {
                name: pipelineRun.metadata.name,
                namespace: pipelineRun.metadata.namespace,
              },
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
      }),
      accessReview: asAccessReview(PipelineRunModel, pipelineRun, 'update'),
    }),
    [t, pipelineRun],
  );
  const action = useMemo<Action[]>(
    () => (!hideAction ? [factory.cancelPipelineRunFinally()] : []),
    [factory, hideAction],
  );
  return action;
};

const useRerunPipelineRunAction = (pipelineRun: PipelineRunKind, redirect: boolean): Action[] => {
  const { t } = useTranslation();
  const launchModal = useOverlay();
  const factory = useMemo(
    () => ({
      rerunPipelineRun: () => ({
        id: 'rerun-pipeline-run',
        label: t('pipelines-plugin~Rerun'),
        cta: () => {
          const namespace = _.get(pipelineRun, 'metadata.namespace');
          const { pipelineRef, pipelineSpec } = pipelineRun?.spec;
          if (namespace && (pipelineRef?.name || pipelineSpec || pipelineRef?.resolver)) {
            k8sCreate(PipelineRunModel, getPipelineRunData(null, pipelineRun))
              .then(redirect ? handlePipelineRunSubmit : undefined)
              .catch((err) => launchModal(ErrorModal, { error: err.message }));
          } else {
            launchModal(ErrorModal, {
              error: t(
                'pipelines-plugin~Invalid PipelineRun configuration, unable to start Pipeline.',
              ),
            });
          }
        },
      }),
      accessReview: asAccessReview(PipelineRunModel, pipelineRun, 'update'),
    }),
    [pipelineRun, t, redirect, launchModal],
  );
  const action = useMemo<Action[]>(() => [factory.rerunPipelineRun()], [factory]);
  return action;
};

const useDeletePipelineRunAction = (pipelineRun: K8sResourceKind): Action[] => {
  const { t } = useTranslation();
  const launchModal = useOverlay();
  const tektonResultsFlag =
    pipelineRun?.metadata?.annotations?.['results.tekton.dev/log'] ||
    pipelineRun?.metadata?.annotations?.['results.tekton.dev/record'] ||
    pipelineRun?.metadata?.annotations?.['results.tekton.dev/result'];
  const isResourceLoadedFromTR =
    pipelineRun?.metadata?.annotations?.[RESOURCE_LOADED_FROM_RESULTS_ANNOTATION];

  const factory = useMemo(() => {
    const message = (
      <p>
        {t(
          'pipelines-plugin~This action will delete resource from k8s but still the resource can be fetched from Tekton Results',
        )}
      </p>
    );
    return {
      deletePipelineRun: () => ({
        id: 'delete-pipeline-run',
        label: t('pipelines-plugin~Delete'),
        cta: () => {
          launchModal(DeleteOverlay, {
            kind: PipelineRunModel,
            resource: pipelineRun,
            message: !isResourceLoadedFromTR && tektonResultsFlag ? message : <>{''}</>,
          });
        },
      }),
      accessReview: asAccessReview(PipelineRunModel, pipelineRun, 'delete'),
      isDisabled: !!isResourceLoadedFromTR,
      tooltip: isResourceLoadedFromTR
        ? t('pipelines-plugin~Resource is being fetched from Tekton Results.')
        : '',
    };
  }, [pipelineRun, isResourceLoadedFromTR, t, launchModal, tektonResultsFlag]);
  const action = useMemo<Action[]>(() => [factory.deletePipelineRun()], [factory]);
  return action;
};

export const usePipelineRunActionsProvider = (data) => {
  const { obj: pipelineRun, taskRuns, taskRunStatusObj = undefined, redirect = false } = data;
  const rerunPipelineRunAction = useRerunPipelineRunAction(pipelineRun, redirect);
  const stopPipelineRunAction = useStopPipelineRunAction(pipelineRun, taskRuns, taskRunStatusObj);
  const cancelPipelineRunFinallyAction = useCancelPipelineRunFinallyAction(
    pipelineRun,
    taskRuns,
    taskRunStatusObj,
  );
  const deletePipelineRunAction = useDeletePipelineRunAction(pipelineRun);
  const actions = useMemo(() => {
    return [
      ...rerunPipelineRunAction,
      ...stopPipelineRunAction,
      ...cancelPipelineRunFinallyAction,
      ...deletePipelineRunAction,
    ];
  }, [
    rerunPipelineRunAction,
    stopPipelineRunAction,
    cancelPipelineRunFinallyAction,
    deletePipelineRunAction,
  ]);
  return [actions, true, undefined];
};
