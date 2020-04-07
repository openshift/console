import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';

import { KebabOption } from '@console/internal/components/utils';

export const SnapshotPVC = (kind: K8sKind, resource: K8sResourceKind): KebabOption => {
  return {
    label: 'Create Snapshot',
    callback: () => {
      import(
        '../components/modals/volume-snapshot-modal/volume-snapshot-modal' /* webpackChunkName: "ceph-storage-volume-snapshot-modal" */
      )
        .then((m) => m.volumeSnapshotModal({ resource }))
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
