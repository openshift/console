import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';

import { KebabOption } from '@console/internal/components/utils';

export const ClonePVC = (kind: K8sKind, resource: K8sResourceKind): KebabOption => {
  return {
    label: 'Clone',
    callback: () => {
      return import(
        '../components/modals/clone-pvc-modal/clone-pvc-modal' /* webpackChunkName: "ceph-storage-clone-pvc-modal" */
      ).then((m) => m.default({ resource }));
    },
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      namespace: resource.metadata.namespace,
      verb: 'create',
    },
  };
};
