import { useMemo } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8S_VERB_DELETE } from '@console/dynamic-plugin-sdk/src/api/constants';
import { Action } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/lib-core';
import { k8sGet, k8sKill, k8sPatch } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { DeleteOverlay } from '@console/internal/components/modals/delete-modal';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import { referenceFor } from '@console/internal/module/k8s';
import { getAccessReviewResourceAttributes } from '@console/shared/src/utils/access-review';
import { UninstallOperatorOverlay } from '../components/modals/uninstall-operator-modal';
import { ClusterServiceVersionModel, SubscriptionModel } from '../models';

const useClusterServiceVersionActionProvider = ({
  resource,
  subscription,
}): [Action[], boolean, any] => {
  const { t } = useTranslation();
  const launcher = useOverlay();
  const csvDeleteAccessReviewAttributes = useMemo(
    () => getAccessReviewResourceAttributes(K8S_VERB_DELETE, ClusterServiceVersionModel, resource),
    [resource],
  );
  const subscriptionDeleteAccessReviewAttributes = useMemo(
    () => getAccessReviewResourceAttributes(K8S_VERB_DELETE, SubscriptionModel, subscription),
    [subscription],
  );

  const actions = useMemo(() => {
    if (!resource) {
      return [];
    }
    if (_.isEmpty(subscription)) {
      return [
        {
          id: 'delete-csv',
          label: t('public~Delete {{kind}}', { kind: ClusterServiceVersionModel.label }),
          cta: () =>
            launcher(DeleteOverlay, {
              kind: ClusterServiceVersionModel,
              resource,
            }),
          accessReview: csvDeleteAccessReviewAttributes,
        },
      ];
    }

    const editSubscriptionAction: Action = {
      id: 'edit-subscription',
      label: t('olm~Edit Subscription'),
      cta: {
        href: `${resourceObjPath(subscription, referenceFor(subscription))}/yaml`,
      },
    };

    const uninstallAction: Action = {
      id: 'uninstall-operator',
      label: t('olm~Uninstall Operator'),
      cta: () =>
        launcher(UninstallOperatorOverlay, {
          k8sKill,
          k8sGet,
          k8sPatch,
          subscription,
          csv: resource,
          blocking: true,
        }),
      accessReview: subscriptionDeleteAccessReviewAttributes,
    };

    return [editSubscriptionAction, uninstallAction];
  }, [
    resource,
    subscription,
    t,
    launcher,
    csvDeleteAccessReviewAttributes,
    subscriptionDeleteAccessReviewAttributes,
  ]);
  return [actions, true, null];
};

export default useClusterServiceVersionActionProvider;
