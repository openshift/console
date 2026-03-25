import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Action, K8sResourceCommon } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { DeploymentConfigKind, K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

const retryRollout = (model: K8sKind, obj: K8sResourceKind) => {
  const patch = [
    {
      path: '/metadata/annotations/openshift.io~1deployment.phase',
      op: 'replace',
      value: 'New',
    },
    {
      path: '/metadata/annotations/openshift.io~1deployment.cancelled',
      op: 'add',
      value: '',
    },
    {
      path: '/metadata/annotations/openshift.io~1deployment.cancelled',
      op: 'remove',
    },
    {
      path: '/metadata/annotations/openshift.io~1deployment.status-reason',
      op: 'remove',
    },
  ];
  return k8sPatchResource({
    model,
    resource: obj,
    data: patch,
  });
};

const useReplicationController = (resource: DeploymentConfigKind) => {
  const [rcModel, rcModelInFlight] = useK8sModel('ReplicationController');

  const watch = !resource.spec?.paused && !rcModelInFlight;

  return useK8sWatchResource<K8sResourceCommon>(
    watch
      ? {
          kind: rcModel.kind,
          namespace: resource.metadata?.namespace,
          namespaced: true,
          selector: {
            matchLabels: {
              'openshift.io/deployment-config.name': resource.metadata?.name || '',
            },
          },
        }
      : null,
  );
};

export const useRetryRolloutAction = (resource: DeploymentConfigKind): Action => {
  const { t } = useTranslation();
  const launchModal = useOverlay();
  const [dcModel] = useK8sModel(referenceFor(resource));
  const [rcModel] = useK8sModel('ReplicationController');
  const [rc] = useReplicationController(resource);

  const canRetry =
    !resource.spec?.paused &&
    rc?.metadata?.annotations?.['openshift.io/deployment.phase'] === 'Failed' &&
    resource.status?.latestVersion !== 0;

  return useMemo<Action>(
    () => ({
      id: 'retry-rollout',
      label: t('console-app~Retry rollout'),
      cta: () =>
        retryRollout(rcModel, rc).catch((err) => launchModal(ErrorModal, { error: err.message })),
      insertAfter: 'start-rollout',
      disabled: !canRetry,
      disabledTooltip: !canRetry
        ? t(
            'console-app~This action is only enabled when the latest revision of the ReplicationController resource is in a failed state.',
          )
        : undefined,
      accessReview: {
        group: dcModel.apiGroup,
        resource: dcModel.plural,
        name: resource.metadata?.name,
        namespace: resource.metadata?.namespace,
        verb: 'patch',
      },
    }),
    [t, dcModel, rcModel, rc, canRetry, resource, launchModal],
  );
};
