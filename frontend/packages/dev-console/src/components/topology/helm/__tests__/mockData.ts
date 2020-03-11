export const mockManifest = [
  {
    kind: 'Secret',
    metadata: {
      name: 'mysql2',
      namespace: 'jeff-project',
    },
  },
  {
    kind: 'PersistentVolumeClaim',
    metadata: {
      name: 'mysql2-pvc2',
      namespace: 'jeff-project',
    },
  },
  {
    kind: 'ConfigMap',
    metadata: {
      name: 'mysql2-test',
      namespace: 'jeff-project',
    },
  },
  {
    kind: 'PersistentVolumeClaim',
    metadata: {
      name: 'mysql2',
      namespace: 'jeff-project',
    },
  },
  {
    kind: 'Deployment',
    metadata: {
      name: 'mysql2-d2',
      namespace: 'jeff-project',
    },
  },
  {
    kind: 'Service',
    metadata: {
      name: 'mysql2',
      namespace: 'jeff-project',
    },
  },
  {
    kind: 'Deployment',
    metadata: {
      name: 'mysql2',
      namespace: 'jeff-project',
    },
  },
];
