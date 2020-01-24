import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';

import { KebabOption } from '@console/internal/components/utils';

export const RestorePVC = (kind: K8sKind, resource: K8sResourceKind): KebabOption => {
  return {
    label: 'Restore',
    callback: () => {
      const clusterObject = { resource };
      import(
        '../components/modals/restore-pvc-modal/restore-pvc-modal' /* webpackChunkName: "ceph-storage-restore-pvc-modal" */
      )
        .then((m) => m.default(clusterObject))
        // eslint-disable-next-line no-console
        .catch((e) => console.error(e));
    },
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      namespace: resource.metadata.namespace,
      name: resource.metadata.name,
      verb: 'create',
    },
  };
};
