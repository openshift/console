import { testName } from '@console/internal-integration-tests/protractor.conf';

export const testBucket = {
  apiVersion: 'objectbucket.io/v1alpha1',
  kind: 'ObjectBucketClaim',
  metadata: {
    namespace: testName,
    name: 'test-bucket',
  },
  spec: {
    ssl: false,
    storageClassName: 'openshift-storage.noobaa.io',
    generateBucketName: 'test-bucket',
  },
};
