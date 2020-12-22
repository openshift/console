export const testNoProvisionerSC = {
  apiVersion: 'storage.k8s.io/v1',
  kind: 'StorageClass',
  metadata: { name: 'test-no-prov-sc' },
  provisioner: 'kubernetes.io/no-provisioner',
  reclaimPolicy: 'Delete',
};

export const testEbsSC = {
  apiVersion: 'storage.k8s.io/v1',
  kind: 'StorageClass',
  metadata: { name: 'test-ebs-sc' },
  provisioner: 'kubernetes.io/aws-ebs',
  parameters: { type: 'io1' },
  reclaimPolicy: 'Retain',
};
