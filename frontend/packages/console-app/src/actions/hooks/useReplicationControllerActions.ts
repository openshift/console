import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { rollbackModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { DeploymentConfigModel } from '@console/internal/models';
import { ReplicationControllerKind, K8sModel } from '@console/internal/module/k8s';
import { getOwnerNameByKind } from '@console/shared/src';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { ReplicationControllerActionCreator, ActionObject } from './types';

const INACTIVE_STATUSES = ['New', 'Pending', 'Running'];

/**
 * A React hook for retrieving actions related to a ReplicationController resource.
 *
 * @param kind - The K8s kind model for the ReplicationController.
 * @param obj - The specific ReplicationController resource instance for which to generate actions.
 * @param [filterActions] - Optional. If provided, the returned object will contain only the specified actions.
 * Specify which actions to include using ReplicationControllerActionCreator enum values.
 * If omitted, it will contain all ReplicationController actions.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns A tuple containing the actions object and a boolean indicating if actions are ready to use.
 * When isReady is false, do not access properties on the actions object.
 * When isReady is true, all requested actions are guaranteed to exist on the actions object.
 *
 */
export const useReplicationControllerActions = <
  T extends readonly ReplicationControllerActionCreator[]
>(
  kind: K8sModel,
  obj: ReplicationControllerKind,
  filterActions?: T,
): [ActionObject<T>, boolean] => {
  const { t } = useTranslation();
  const openCancelRolloutConfirm = useWarningModal({
    title: t('console-app~Cancel rollout'),
    children: t('console-app~Are you sure you want to cancel this rollout?'),
    confirmButtonLabel: t('console-app~Yes, cancel'),
    cancelButtonLabel: t("console-app~No, don't cancel"),
    onConfirm: () => {
      return k8sPatchResource({
        model: kind,
        resource: obj,
        data: [
          {
            op: 'add',
            path: '/metadata/annotations/openshift.io~1deployment.cancelled',
            value: 'true',
          },
          {
            op: 'add',
            path: '/metadata/annotations/openshift.io~1deployment.status-reason',
            value: 'cancelled by the user',
          },
        ],
      });
    },
  });

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const factory = useMemo(
    () => ({
      [ReplicationControllerActionCreator.RollbackDeploymentConfig]: (): Action => ({
        id: 'rollback-deployment-config',
        label: t('console-app~Rollback'),
        disabled: INACTIVE_STATUSES.includes(
          obj?.metadata?.annotations?.['openshift.io/deployment.phase'] || '',
        ),
        cta: () =>
          rollbackModal({
            resourceKind: kind,
            resource: obj,
          }),
        accessReview: {
          group: DeploymentConfigModel.apiGroup,
          resource: DeploymentConfigModel.plural,
          name: getOwnerNameByKind(obj, DeploymentConfigModel),
          namespace: obj?.metadata?.namespace,
          verb: 'update' as const,
        },
      }),
      [ReplicationControllerActionCreator.CancelRollout]: (): Action => ({
        id: 'cancel-rollout',
        label: t('console-app~Cancel rollout'),
        cta: () => openCancelRolloutConfirm(),
        accessReview: asAccessReview(kind, obj, 'patch'),
      }),
    }),
    // missing openCancelRolloutConfirm dependency, that causes max depth exceeded error
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, kind, obj],
  );

  const result = useMemo((): [ActionObject<T>, boolean] => {
    const actions = {} as ActionObject<T>;

    if (!kind || !obj) {
      return [actions, false];
    }

    // filter and initialize requested actions or construct list of all ReplicationController actions
    const actionsToInclude =
      memoizedFilterActions || Object.values(ReplicationControllerActionCreator);

    actionsToInclude.forEach((actionType) => {
      if (factory[actionType]) {
        actions[actionType] = factory[actionType]();
      }
    });

    return [actions, true];
  }, [factory, memoizedFilterActions, kind, obj]);

  return result;
};
