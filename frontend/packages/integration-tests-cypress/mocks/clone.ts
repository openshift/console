import { PVC, PVC_NAME } from './storage-common';

export const CLONE_NAME = `${PVC_NAME}-clone`;
export const CLONE_SIZE = '2';

/** PVC with different storage class (gp3) for testing cross-storage-class cloning */
export const PVCGP3 = {
  apiVersion: PVC.apiVersion,
  kind: PVC.kind,
  metadata: {
    name: 'testpvcgp3',
  },
  spec: {
    storageClassName: 'gp3-csi',
    accessModes: PVC.spec.accessModes,
    resources: {
      requests: {
        storage: PVC.spec.resources.requests.storage,
      },
    },
  },
};
