import { Map as ImmutableMap } from 'immutable';

export { PodModel } from '../../../models';

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

export const firehoseChildPropsWithoutModels = {
  inFlight: false,
  k8sModels: ImmutableMap({}),
  reduxIDs: [],
  resources: {},
  loaded: true,
  loadError: undefined,
  filters: {},
  watchK8sList: expect.any(Function),
  watchK8sObject: expect.any(Function),
  stopK8sWatch: expect.any(Function),
};
