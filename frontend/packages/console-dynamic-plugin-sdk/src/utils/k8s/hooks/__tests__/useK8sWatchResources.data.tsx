export { PodModel } from '@console/internal/models';

export const podData = {
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: {
    name: 'my-pod',
    namespace: 'default',
    resourceVersion: '123',
  },
};

export const podList = {
  apiVersion: 'v1',
  kind: 'PodList',
  items: ['my-pod1', 'my-pod2', 'my-pod3'].map((name) => ({
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name,
      namespace: 'default',
      resourceVersion: '123',
    },
  })),
  metadata: { resourceVersion: '123' },
};
