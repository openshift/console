import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';

// TODO: Make following more generic if ever needed
export type StorageClass = K8sResourceCommon & {
  kind: 'StorageClass';
  apiVersion: 'storage.k8s.io/v1';
  provisioner: 'kubernetes.io/vsphere-volume';
  parameters: {
    datastore: string;
    diskformat: 'thin';
  };
  reclaimPolicy: 'Delete';
  volumeBindingMode: 'Immediate';
};
