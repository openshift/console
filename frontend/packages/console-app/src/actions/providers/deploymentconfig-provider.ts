import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DeleteResourceAction } from '@console/dev-console/src/actions/context-menu';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/dist/core/lib/lib-core';
import { Action, K8sResourceCommon } from '@console/dynamic-plugin-sdk/src';
import { errorModal } from '@console/internal/components/modals';
import { DeploymentConfigKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { DeploymentActionFactory, retryRollout } from '../creators/deployment-factory';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { useHPAActions } from '../creators/hpa-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';

const useReplicationController = (resource: DeploymentConfigKind) => {
  const [rcModel, rcModelInFlight] = useK8sModel('ReplicationController');

  const watch = !resource.spec?.paused && !rcModelInFlight;

  return useK8sWatchResource<K8sResourceCommon>(
    watch
      ? {
          kind: rcModel.kind,
          namespace: resource.metadata.namespace,
          namespaced: true,
          selector: {
            matchLabels: {
              'openshift.io/deployment-config.name': resource.metadata.name,
            },
          },
        }
      : null,
  );
};

const useRetryRolloutAction = (resource: DeploymentConfigKind): Action => {
  const { t } = useTranslation();
  const [dcModel] = useK8sModel(referenceFor(resource));
  const [rcModel] = useK8sModel('ReplicationController');
  const [rc] = useReplicationController(resource);

  const canRetry =
    !resource.spec?.paused &&
    rc?.metadata?.annotations?.['openshift.io/deployment.phase'] === 'Failed' &&
    resource.status?.latestVersion !== 0;

  return React.useMemo<Action>(
    () => ({
      id: 'retry-rollout',
      label: t('console-app~Retry rollout'),
      cta: () => retryRollout(rcModel, rc).catch((err) => errorModal({ error: err.message })),
      insertAfter: 'start-rollout',
      disabled: !canRetry,
      disabledTooltip: !canRetry
        ? t(
            'console-app~This action is only enabled when the latest revision of the ReplicationController resource is in a failed state.',
          )
        : null,
      accessReview: {
        group: dcModel.apiGroup,
        resource: dcModel.plural,
        name: resource.metadata.name,
        namespace: resource.metadata.namespace,
        verb: 'patch',
      },
    }),
    [t, dcModel, rcModel, rc, canRetry, resource],
  );
};

export const useDeploymentConfigActionsProvider = (resource: DeploymentConfigKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [hpaActions, relatedHPAs] = useHPAActions(kindObj, resource);
  const [pdbActions] = usePDBActions(kindObj, resource);
  const retryRolloutAction = useRetryRolloutAction(resource);

  const [commonActions, isReady] = useCommonActions(kindObj, resource, [
    CommonActionCreator.ModifyCount,
    CommonActionCreator.Delete,
    CommonActionCreator.ModifyLabels,
    CommonActionCreator.ModifyAnnotations,
    CommonActionCreator.AddStorage,
  ] as const);

  const deploymentConfigActions = React.useMemo(
    () =>
      isReady
        ? [
            ...(relatedHPAs?.length === 0 ? [commonActions.ModifyCount] : []),
            ...hpaActions,
            ...pdbActions,
            getHealthChecksAction(kindObj, resource),
            DeploymentActionFactory.StartDCRollout(kindObj, resource),
            retryRolloutAction,
            DeploymentActionFactory.PauseRollout(kindObj, resource),
            commonActions.AddStorage,
            DeploymentActionFactory.EditResourceLimits(kindObj, resource),
            commonActions.ModifyLabels,
            commonActions.ModifyAnnotations,
            DeploymentActionFactory.EditDeployment(kindObj, resource),
            ...(resource.metadata.annotations?.['openshift.io/generated-by'] ===
            'OpenShiftWebConsole'
              ? [DeleteResourceAction(kindObj, resource)]
              : [commonActions.Delete]),
          ]
        : [],
    [
      resource,
      kindObj,
      hpaActions,
      pdbActions,
      relatedHPAs,
      retryRolloutAction,
      commonActions,
      isReady,
    ],
  );

  return [deploymentConfigActions, !inFlight, undefined];
};
