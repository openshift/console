export const storageClass = {
  apiVersion: 'storage.k8s.io/v1',
  kind: 'StorageClass',
  metadata: {
    name: 'test-sc',
    namespace: 'openshift-storage',
  },
  provisioner: 'kubernetes.io/no-provisioner',
  reclaimPolicy: 'Delete',
};
