// OCS namespace
export const NS = 'openshift-storage';
export const ACCESS_KEY = '[a-zA-Z0-9]{20}';
export const ATTACH_TO_DEPLOYMENT = 'Attach to Deployment';
export const BOUND = 'Bound';
export const DEPLOYMENT_REPLICAS_STATUS = 'MinimumReplicasAvailable';
export const MASK = '•••••';
export const MINUTE = 60 * 1000;
export const NOOBAA_LABEL = 'app=noobaa';
export const NO_ANNOTATIONS = '0 annotations';
export const OBC_NAME = 'test-obc';
export const OBC_RESOURCE_PATH = 'objectbucket.io~v1alpha1~ObjectBucketClaim';
export const OBC_STORAGE_CLASS = 'openshift-storage\\.noobaa\\.io';
export const OBC_STORAGE_CLASS_EXACT = 'openshift-storage.noobaa.io';
export const SECOND = 1000;
export const SECRET_KEY = '[a-zA-Z0-9/+]{40}';
export const testName = `test-${Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, '')
  .substr(0, 5)}`;
export const testBucket = {
  apiVersion: 'objectbucket.io/v1alpha1',
  kind: 'ObjectBucketClaim',
  metadata: {
    namespace: 'openshift-storage',
    name: testName,
  },
  spec: {
    storageClassName: 'openshift-storage.noobaa.io',
    generateBucketName: 'test-bucket',
  },
};
