import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { rollbackModal } from '@console/internal/components/modals';
import { DeploymentModel } from '@console/internal/models';
import { ReplicaSetKind, K8sModel } from '@console/internal/module/k8s';
import { getOwnerNameByKind } from '@console/shared/src';
import { ReplicaSetActionCreator } from './types';

/**
 * A React hook for retrieving actions related to ReplicaSet resources.
 *
 * @param {K8sModel} kind - The K8s model for the resource.
 * @param {ReplicaSetKind} resource - The specific ReplicaSet resource instance.
 * @param {ReplicaSetActionCreator[]} [filterActions] - Optional. If provided, returns only specified actions.
 * @returns {Action[]} An array containing the generated actions.
 */
export const useReplicaSetActions = (
  kind: K8sModel,
  resource: ReplicaSetKind,
  filterActions?: ReplicaSetActionCreator[],
): Action[] => {
  const { t } = useTranslation();
  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const factory = useMemo(
    () => ({
      [ReplicaSetActionCreator.RollbackDeploymentAction]: (): Action => ({
        id: 'rollback-deployment',
        label: t('console-app~Rollback'),
        cta: () =>
          rollbackModal({
            resourceKind: kind,
            resource,
          }),
        accessReview: {
          group: DeploymentModel.apiGroup,
          resource: DeploymentModel.plural,
          name: getOwnerNameByKind(resource, DeploymentModel),
          namespace: resource?.metadata?.namespace,
          verb: 'patch',
        },
      }),
    }),
    [t, kind, resource],
  );

  const actions = useMemo<Action[]>(() => {
    if (memoizedFilterActions) {
      return memoizedFilterActions.map((creator) => factory[creator]());
    }
    return [factory.RollbackDeploymentAction()];
  }, [factory, memoizedFilterActions]);

  return actions;
};
