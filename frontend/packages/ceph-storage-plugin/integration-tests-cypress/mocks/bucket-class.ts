import { StoreType } from '../views/store';

export const bucketStore = (storeName: string) => ({
  apiVersion: 'noobaa.io/v1alpha1',
  kind: 'BackingStore',
  metadata: {
    name: storeName,
  },
  spec: {
    pvPool: {
      numVolumes: 1,
      storageClass: 'gp2',
      resources: {
        requests: {
          storage: '50Gi',
        },
      },
    },
    type: 'pv-pool',
  },
});

export const namespaceStore = (name: string, type: StoreType) => ({
  apiVersion: 'noobaa.io/v1alpha1',
  kind: type === StoreType.NamespaceStore ? 'NamespaceStore' : 'BackingStore',
  metadata: {
    name,
    namespace: 'openshift-storage',
  },
  spec: {
    awsS3: {
      region: 'us-east-1',
      secret: {
        name: `${name}-secret`,
        namespace: 'openshift-storage',
      },
      targetBucket: 'target',
    },
    type: 'aws-s3',
  },
});
