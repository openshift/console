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

export const testPersistentVolume1 = {
  kind: 'PersistentVolume',
  apiVersion: 'v1',
  metadata: { name: 'test-pv-1' },
  spec: {
    capacity: {
      storage: '10Mi',
    },
    local: { path: '/mnt/local-storage/test-1/' },
    accessModes: ['ReadWriteOnce'],
    persistentVolumeReclaimPolicy: 'Delete',
    storageClassName: 'test-no-prov-sc',
    nodeAffinity: {
      required: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: 'kubernetes.io/hostname',
                operator: 'In',
                values: [],
              },
            ],
          },
        ],
      },
    },
  },
};

export const testPersistentVolume2 = {
  kind: 'PersistentVolume',
  apiVersion: 'v1',
  metadata: { name: 'test-pv-2' },
  spec: {
    capacity: {
      storage: '10Mi',
    },
    local: { path: '/mnt/local-storage/test-2/' },
    accessModes: ['ReadWriteOnce'],
    persistentVolumeReclaimPolicy: 'Delete',
    storageClassName: 'test-no-prov-sc',
    nodeAffinity: {
      required: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: 'kubernetes.io/hostname',
                operator: 'In',
                values: [],
              },
            ],
          },
        ],
      },
    },
  },
};

export const testPersistentVolume3 = {
  kind: 'PersistentVolume',
  apiVersion: 'v1',
  metadata: { name: 'test-pv-3' },
  spec: {
    capacity: {
      storage: '10Mi',
    },
    local: { path: '/mnt/local-storage/test-3/' },
    accessModes: ['ReadWriteOnce'],
    persistentVolumeReclaimPolicy: 'Delete',
    storageClassName: 'test-no-prov-sc',
    nodeAffinity: {
      required: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: 'kubernetes.io/hostname',
                operator: 'In',
                values: [],
              },
            ],
          },
        ],
      },
    },
  },
};
