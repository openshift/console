export const mockRevisionsData = [
  {
    apiVersion: 'serving.knative.dev/v1beta1',
    kind: 'Revision',
    metadata: {
      name: 'tag-portal-v1-sh6rp',
      namespace: 'jai-test',
      uid: '2e4c5a8f-fa1e-4a75-b6dc-d67e4c8f8cc0',
    },
    resources: {},
  },
];

export const mockRoutesData = [
  {
    apiVersion: 'serving.knative.dev/v1beta1',
    kind: 'Route',
    metadata: {
      name: 'tag-portal-v1',
      namespace: 'jai-test',
      uid: '8f88ed7c-0243-4e57-94d8-1203853911a3',
    },
    resources: {},
    status: {
      traffic: [{ latestRevision: true, percent: 100, revisionName: 'tag-portal-v1-sh6rp' }],
      url: 'http://tag-portal-v1.jai-test.apps.rhamilto.devcluster.openshift.com',
    },
  },
];
