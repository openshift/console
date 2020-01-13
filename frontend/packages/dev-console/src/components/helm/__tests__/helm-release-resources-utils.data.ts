import { K8sResourceKind } from '@console/internal/module/k8s';

export const resources: {
  [key: string]: { data: K8sResourceKind[] };
} = {
  Deployment: {
    data: [
      {
        kind: 'Deployment',
        metadata: {
          name: 'helm-mysql',
          namespace: 'xyz',
        },
      },
    ],
  },
  StatefulSet: {
    data: [
      {
        kind: 'StatefulSet',
        metadata: {
          name: 'helm-mysql',
          namespace: 'xyz',
        },
      },
    ],
  },
  Pod: {
    data: [],
  },
};

export const flattenedResources = [
  { kind: 'Deployment', metadata: { name: 'helm-mysql', namespace: 'xyz' } },
  {
    kind: 'StatefulSet',
    metadata: { name: 'helm-mysql', namespace: 'xyz' },
  },
];
