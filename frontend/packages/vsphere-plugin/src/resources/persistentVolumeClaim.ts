import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';

// TODO: Make following more generic (if ever needed)
export type PersistentVolumeClaim = K8sResourceCommon & {
  kind: 'PersistentVolumeClaim';
  apiVersion: 'v1';
  spec: {
    accessModes: ['ReadWriteOnce'];
    resources: {
      requests: {
        storage: '10Gi';
      };
    };
    storageClassName: string;
    volumeMode: 'Filesystem';
  };
  status?: {
    phase: 'Pending' | 'Bound'; // or others
  };
};
