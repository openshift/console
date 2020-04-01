import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';

import { KebabOption } from '@console/internal/components/utils';

export const EditSchedule = (kind: K8sKind, resource: K8sResourceKind): KebabOption => {
  return {
    label: 'Edit Schedule',
    callback: () => {
      return (
        import(
          '../components/modals/edit-schedule-modal/edit-schedule-modal' /* webpackChunkName: "ceph-storage-volume-snapshot-modal" */
        )
          .then((m) => m.default({ resource }))
          // eslint-disable-next-line no-console
          .catch((e) => console.error(e))
      );
    },
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      namespace: resource.metadata.namespace,
      name: resource.metadata.name,
      verb: 'update',
    },
  };
};
