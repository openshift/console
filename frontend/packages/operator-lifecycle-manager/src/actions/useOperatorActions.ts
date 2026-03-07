import { useMemo } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8S_VERB_DELETE } from '@console/dynamic-plugin-sdk/src/api/constants';
import type { Action } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/lib-core';
import { k8sGet, k8sKill, k8sPatch } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import { referenceFor } from '@console/internal/module/k8s';
import { useDeleteModal } from '@console/shared/src/hooks/useDeleteModal';
import { UninstallOperatorOverlay } from '../components/modals/uninstall-operator-modal';
import { ClusterServiceVersionModel, SubscriptionModel } from '../models';

const useOperatorActions = ({ resource, subscription }): [Action[], boolean, any] => {
  const { t } = useTranslation();
  const launchModal = useOverlay();
  const launchDeleteModal = useDeleteModal(resource);

  const actions = useMemo(() => {
    if (!resource) {
      return [];
    }

    if (_.isEmpty(subscription)) {
      return [
        {
          id: 'delete-csv',
          label: t('public~Delete {{kind}}', { kind: ClusterServiceVersionModel.label }),
          cta: launchDeleteModal,
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
          launchModal(UninstallOperatorOverlay, {
            k8sKill,
            k8sGet,
            k8sPatch,
            subscription,
            csv: resource,
            blocking: true,
          }),
        accessReview: asAccessReview(SubscriptionModel, subscription, K8S_VERB_DELETE),
      },
    ];
  }, [resource, subscription, t, launchModal, launchDeleteModal]);
  return [actions, true, null];
};

export default useOperatorActions;
