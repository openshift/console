import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CommonActionCreator } from '@console/app/src/actions/hooks/types';
import { useCommonActions } from '@console/app/src/actions/hooks/useCommonActions';
import { Action } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { asAccessReview } from '@console/internal/components/utils';
import { referenceFor, k8sKill, k8sGet, k8sPatch } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useUninstallOperatorModal } from '../../components/modals/uninstall-operator-modal';
import { ClusterServiceVersionModel } from '../../models';
import { SubscriptionKind } from '../../types';
import { SubscriptionActionCreator } from './types';

/**
 * A React hook for retrieving actions related to a Subscription resource.
 *
 * @param {SubscriptionKind} obj - The specific Subscription resource instance for which to generate actions.
 * @param {SubscriptionActionCreator[]} [filterActions] - Optional. If provided, the returned `actions` array will contain
 * only the specified actions. If omitted, it will contain all Subscription actions. In case of invalid `actionCreators`
 * returned `actions` are an empty array.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 * @returns An array containing the generated action(s).
 */
export const useSubscriptionActions = (
  obj: SubscriptionKind,
  filterActions?: SubscriptionActionCreator[],
): Action[] => {
  const { t } = useTranslation();
  const [model] = useK8sModel(referenceFor(obj));
  const [commonActions] = useCommonActions(model, obj, [CommonActionCreator.Edit]);
  const uninstallOperatorModal = useUninstallOperatorModal({
    k8sKill,
    k8sGet,
    k8sPatch,
    subscription: obj,
  });

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);
  const installedCSV = obj.status?.installedCSV;

  const factory = React.useMemo(
    () => ({
      [SubscriptionActionCreator.RemoveSubscription]: () => ({
        id: 'remove-subscription',
        label: t('olm~Remove Subscription'),
        cta: () => uninstallOperatorModal(),
        accessReview: asAccessReview(model, obj, 'delete'),
      }),
      [SubscriptionActionCreator.ViewClusterServiceVersion]: () => {
        return {
          id: 'view-cluster-service-version',
          label: t('olm~View ClusterServiceVersion...'),
          cta: {
            href: `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${installedCSV}`,
          },
        };
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [installedCSV, model, obj, t],
  );

  // filter and initialize requested actions or construct list of all SubscriptionActions
  const actions = React.useMemo<Action[]>(() => {
    if (memoizedFilterActions) {
      return memoizedFilterActions.map((creator) => factory[creator]());
    }
    return [
      commonActions.Edit,
      factory.RemoveSubscription(),
      ...(installedCSV ? [factory.ViewClusterServiceVersion()] : []),
    ];
  }, [commonActions.Edit, factory, installedCSV, memoizedFilterActions]);

  return actions;
};
