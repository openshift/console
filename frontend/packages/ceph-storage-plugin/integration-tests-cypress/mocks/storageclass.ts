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

export const getPVJSON = (id: number, nodeName: string, scName: string) => {
  return {
    kind: 'PersistentVolume',
    apiVersion: 'v1',
    metadata: { name: `test-pv-${id}` },
    spec: {
      capacity: {
        storage: '10Mi',
      },
      local: { path: `/mnt/local-storage/test-${id}/` },
      accessModes: ['ReadWriteOnce'],
      persistentVolumeReclaimPolicy: 'Delete',
      storageClassName: scName,
      nodeAffinity: {
        required: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: 'kubernetes.io/hostname',
                  operator: 'In',
                  values: [nodeName],
                },
              ],
            },
          ],
        },
      },
    },
  };
};
