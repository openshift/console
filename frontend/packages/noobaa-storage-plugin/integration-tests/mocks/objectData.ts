export const backingStore = {
  apiVersion: 'noobaa.io/v1alpha1',
  kind: 'BackingStore',
  metadata: {
    name: 'noobaa-default-backing-store',
    namespace: 'openshift-storage',
  },
  spec: {
    awsS3: {
      region: 'us-east-1',
      secret: {
        name: 'noobaa-cloud-creds-secret',
        namespace: 'openshift-storage',
      },
      targetBucket: 'noobaa-backing-store-dummy',
    },
    type: 'aws-s3',
  },
};

export const bucketClass = {
  apiVersion: 'noobaa.io/v1alpha1',
  kind: 'BucketClass',
  metadata: {
    name: 'noobaa-default-bucket-class',
    namespace: 'openshift-storage',
  },
  spec: {
    placementPolicy: {
      tiers: [
        {
          backingStores: ['noobaa-default-backing-store'],
        },
      ],
    },
  },
};

export const storageClass = {
  apiVersion: 'storage.k8s.io/v1',
  kind: 'StorageClass',
  metadata: {
    name: 'openshift-storage.noobaa.io',
  },
  parameters: {
    bucketclass: 'noobaa-default-bucket-class',
  },
  provisioner: 'openshift-storage.noobaa.io/obc',
  reclaimPolicy: 'Delete',
  volumeBindingMode: 'Immediate',
};

export const objectBucket = {
  apiVersion: 'objectbucket.io/v1alpha1',
  kind: 'ObjectBucket',
  metadata: {
    name: 'test-bucket',
  },
  spec: {
    ObjectBucketName: 'test-bucket',
    additionalConfig: {
      bucketclass: 'noobaa-default-bucket-class',
    },
    bucketName: 'test-bucket',
    storageClassName: 'openshift-storage.noobaa.io',
  },
};
