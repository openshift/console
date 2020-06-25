import { MOCK_SECRET } from '../utils/consts';

export const mockDefaultBS = {
  apiVersion: 'noobaa.io/v1alpha1',
  kind: 'BackingStore',
  metadata: {
    name: 'noobaa-default-backing-store',
  },
  spec: {
    awsS3: {
      region: 'us-east-1',
      secret: {
        name: MOCK_SECRET,
        namespace: 'openshift-storage',
      },
      targetBucket: 'ssd',
    },
    ssl: false,
    type: 'aws-s3',
  },
};
