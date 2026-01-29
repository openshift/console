import { useMemo } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8S_VERB_DELETE } from '@console/dynamic-plugin-sdk/src/api/constants';
import { Action } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/lib-core';
import { k8sGet, k8sKill, k8sPatch } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { DeleteOverlay } from '@console/internal/components/modals/delete-modal';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import { referenceFor } from '@console/internal/module/k8s';
import UninstallOperatorModalProvider from '../components/modals/uninstall-operator-modal';
import { ClusterServiceVersionModel, SubscriptionModel } from '../models';

const useOperatorActions = ({ resource, subscription }): [Action[], boolean, any] => {
  const { t } = useTranslation();
  const launcher = useOverlay();

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
          accessReview: asAccessReview(ClusterServiceVersionModel, resource, K8S_VERB_DELETE),
        },
      ];
    }

    return [
      {
        id: 'edit-subscription',
        label: t('olm~Edit Subscription'),
        cta: {
          href: `${resourceObjPath(subscription, referenceFor(subscription))}/yaml`,
        },
      },
      {
        id: 'uninstall-operator',
        label: t('olm~Uninstall Operator'),
        cta: () =>
          launcher(UninstallOperatorModalProvider, {
            k8sKill,
            k8sGet,
            k8sPatch,
            subscription,
            csv: resource,
          }),
        accessReview: asAccessReview(SubscriptionModel, subscription, K8S_VERB_DELETE),
      },
    ];
  }, [resource, subscription, t, launcher]);
  return [actions, true, null];
};

export default useOperatorActions;
