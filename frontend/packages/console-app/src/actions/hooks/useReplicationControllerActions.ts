import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { rollbackModal, confirmModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { DeploymentConfigModel } from '@console/internal/models';
import { ReplicationControllerKind, K8sKind, k8sPatch } from '@console/internal/module/k8s';
import { getOwnerNameByKind } from '@console/shared/src';
import { ReplicationControllerActionCreator, ActionObject } from './types';

const INACTIVE_STATUSES = ['New', 'Pending', 'Running'];

/**
 * A React hook for retrieving actions related to a ReplicationController resource.
 *
 * @param {K8sKind} kind - The K8s kind model for the ReplicationController.
 * @param {ReplicationControllerKind} obj - The specific ReplicationController resource instance for which to generate actions.
 * @param {ReplicationControllerActionCreator[]} [filterActions] - Optional. If provided, the returned object will contain only the specified actions.
 * Specify which actions to include using ReplicationControllerActionCreator enum values.
 * If omitted, it will contain all ReplicationController actions.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns {[ActionObject<T>, boolean]} A tuple containing the actions object and a boolean indicating if actions are ready to use.
 * When isReady is false, do not access properties on the actions object.
 * When isReady is true, all requested actions are guaranteed to exist on the actions object.
 *
 * @example
 * // Getting all actions for ReplicationController resource
 * const MyReplicationControllerComponent = ({ kind, obj }) => {
 *   const [actions, isReady] = useReplicationControllerActions(kind, obj);
 *   return <Kebab actions={Object.values(actions)} />;
 * };
 */
export const useReplicationControllerActions = <
  T extends readonly ReplicationControllerActionCreator[]
>(
  kind: K8sKind,
  obj: ReplicationControllerKind,
  filterActions?: T,
): [ActionObject<T>, boolean] => {
  const { t } = useTranslation();

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const factory = React.useMemo(
    () => ({
      [ReplicationControllerActionCreator.RollbackDeploymentConfig]: (): Action => ({
        id: 'rollback-deployment-config',
        label: t('console-app~Rollback'),
        disabled: INACTIVE_STATUSES.includes(
          obj?.metadata?.annotations?.['openshift.io/deployment.phase'],
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
        cta: () =>
          confirmModal({
            title: t('console-app~Cancel rollout'),
            message: t('console-app~Are you sure you want to cancel this rollout?'),
            btnText: t('console-app~Yes, cancel'),
            cancelText: t("console-app~No, don't cancel"),
            executeFn: () =>
              k8sPatch(kind, obj, [
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
              ]),
          }),
        accessReview: asAccessReview(kind, obj, 'patch'),
      }),
    }),
    [t, kind, obj],
  );

  const result = React.useMemo((): [ActionObject<T>, boolean] => {
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
