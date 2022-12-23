import i18next from 'i18next';
import { Action, K8sModel } from '@console/dynamic-plugin-sdk';
import { TopologyApplicationObject } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { deleteModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { deleteResourceModal } from '@console/shared';
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
            reqs.push(
              cleanUpWorkload(resource.resource, resource.data?.isKnativeResource ?? false),
            );
          });
          return Promise.all(reqs);
        },
      });
    },
    accessReview: asAccessReview(resourceModel, primaryResource, 'delete'),
  };
};

export const DeleteResourceAction = (
  kind: K8sModel,
  obj: K8sResourceKind,
  isKnativeResource?: boolean,
): Action => ({
  id: `delete-resource`,
  label: i18next.t('devconsole~Delete {{kind}}', { kind: kind.kind }),
  cta: () =>
    deleteModal({
      kind,
      resource: obj,
      deleteAllResources: () => cleanUpWorkload(obj, isKnativeResource),
    }),
  accessReview: asAccessReview(kind, obj, 'delete'),
});
