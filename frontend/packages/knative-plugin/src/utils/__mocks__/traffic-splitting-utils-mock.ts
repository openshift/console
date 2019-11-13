export const mockTrafficData = [
  { percent: 50, tag: 'tag-1', revisionName: 'rev-1' },
  { percent: 50, tag: 'tag-2', revisionName: 'rev-2' },
];
export const mockServiceData = {
  apiVersion: 'serving.knative.dev/v1beta1',
  kind: 'Service',
  spec: {
    traffic: [
      {
        percent: 50,
        revisionName: 'rev-1',
        tag: 'tag-1',
      },
      {
        percent: 50,
        revisionName: 'rev-2',
        tag: 'tag-2',
      },
    ],
  },
  status: {
    traffic: [
      {
        latestRevision: false,
        percent: 100,
        revisionName: 'rev-1',
        tag: 'tag-1',
      },
    ],
  },
};

export const mockUpdateRequestObj = {
  apiVersion: 'serving.knative.dev/v1beta1',
  kind: 'Service',
  spec: {
    traffic: [
      {
        percent: 50,
        revisionName: 'rev-1',
        tag: 'tag-1',
      },
      {
        percent: 50,
        revisionName: 'rev-2',
        tag: 'tag-2',
      },
    ],
  },
};

export const mockRevisions = [
  {
    apiVersion: 'serving.knative.dev/v1beta1',
    kind: 'Revision',
    metadata: {
      name: 'rev-1',
      namespace: 'namespace',
    },
  },
  {
    apiVersion: 'serving.knative.dev/v1beta1',
    kind: 'Revision',
    metadata: {
      name: 'rev-2',
      namespace: 'namespace',
    },
  },
  {
    apiVersion: 'serving.knative.dev/v1beta1',
    kind: 'Revision',
    metadata: {
      name: 'rev-3',
      namespace: 'namespace',
    },
  },
];

export const mockRevisionItems = {
  'rev-1': 'rev-1',
  'rev-2': 'rev-2',
  'rev-3': 'rev-3',
};
