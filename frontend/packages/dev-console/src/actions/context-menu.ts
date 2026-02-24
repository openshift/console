import { useMemo } from 'react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import type { Action, K8sModel } from '@console/dynamic-plugin-sdk';
import type { TopologyApplicationObject } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { asAccessReview } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { deleteResourceModal } from '@console/shared';
import { useDeleteModal } from '@console/shared/src/hooks/useDeleteModal';
import { ApplicationModel } from '@console/topology/src/models';
import { cleanUpWorkload } from '@console/topology/src/utils';

export const DeleteApplicationAction = (
  application: TopologyApplicationObject,
  resourceModel: K8sModel,
): Action => {
  // accessReview needs a resource but group is not a k8s resource,
  // so currently picking the first resource to do the rbac checks (might change in future)
  const primaryResource = application.resources[0].resource;
  return {
    id: 'delete-application',
    label: i18next.t('devconsole~Delete application'),
    cta: () => {
      const reqs = [];
      deleteResourceModal({
        blocking: true,
        resourceName: application.name,
        resourceType: ApplicationModel.label,
        onSubmit: () => {
          application.resources.forEach((resource) => {
            reqs.push(cleanUpWorkload(resource.resource));
          });
          return Promise.all(reqs);
        },
      });
    },
    accessReview: asAccessReview(resourceModel, primaryResource, 'delete'),
  };
};

export const useDeleteResourceAction = (
  kind: K8sModel | undefined,
  obj: K8sResourceKind,
): Action => {
  const { t } = useTranslation();
  const launchDeleteModal = useDeleteModal(obj, undefined, undefined, undefined, () =>
    cleanUpWorkload(obj),
  );

  return useMemo(
    () => ({
      id: `delete-resource`,
      label: t('devconsole~Delete {{kind}}', { kind: kind?.kind }),
      cta: launchDeleteModal,
      accessReview: asAccessReview(kind as K8sModel, obj, 'delete'),
    }),
    [t, kind, obj, launchDeleteModal],
  );
};
