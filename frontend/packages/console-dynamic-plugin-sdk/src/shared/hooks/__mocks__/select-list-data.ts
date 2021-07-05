export const data = [
  {
    metadata: {
      name: 'node-1.internal',
      uid: '1',
      labels: {
        'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
        'kubernetes.io/hostname': 'node-1',
        'node-role.kubernetes.io/worker': '',
      },
      status: {
        capacity: {
          cpu: '16',
        },
        allocatable: {
          memory: '1000Ki',
        },
      },
    },
  },
  {
    metadata: {
      name: 'node-2.internal',
      uid: '2',
      labels: {
        'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
        'kubernetes.io/hostname': 'node-2',
        'node-role.kubernetes.io/worker': '',
      },
      status: {
        capacity: {
          cpu: '16',
        },
        allocatable: {
          memory: '1000Ki',
        },
      },
    },
  },
  {
    metadata: {
      name: 'node-3.internal',
      uid: '3',
      labels: {
        'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
        'kubernetes.io/hostname': 'node-3',
        'node-role.kubernetes.io/worker': '',
      },
      status: {
        capacity: {
          cpu: '16',
        },
        allocatable: {
          memory: '1000Ki',
        },
      },
    },
  },
];

export const visibleRows = new Set(['1', '2', '3']);

export const onRowSelected = jest.fn();
