import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';

import { KebabOption } from '@console/internal/components/utils';

export const DeleteSchedule = (kind: K8sKind, resource: K8sResourceKind): KebabOption => {
  return {
    label: 'Delete Schedule',
    callback: () => {
      const clusterObject = { resource };
      import(
        '@console/internal/components/modals/delete-modal' /* webpackChunkName: "ceph-storage-delete-snapshot-modal" */
      )
        .then((m) =>
          m.deleteModal({
            kind,
            resource: clusterObject.resource,
          }),
        )
        // eslint-disable-next-line no-console
        .catch((e) => console.error(e));
    },
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      namespace: resource.metadata.namespace,
      name: resource.metadata.name,
      verb: 'delete',
    },
  };
};
