export const singleResourceQuota = [
  {
    kind: 'ResourceQuota',
    apiVersion: 'v1',
    metadata: {
      name: 'example',
      namespace: 'ns1',
      uid: 'aa0ab110-82fa-4ad4-9415-d0f946f2fa90',
      resourceVersion: '68977',
      creationTimestamp: '2022-09-08T04:46:36Z',
    },
    spec: {
      hard: {
        pods: '1',
      },
    },
    status: {
      hard: {
        pods: '1',
      },
      used: {
        pods: '1',
      },
    },
  },
];

export const multipleResourceQuota = [
  {
    kind: 'ResourceQuota',
    apiVersion: 'v1',
    metadata: {
      name: 'example',
      namespace: 'ns1',
      uid: 'aa0ab110-82fa-4ad4-9415-d0f946f2fa90',
      resourceVersion: '68977',
      creationTimestamp: '2022-09-08T04:46:36Z',
    },
    spec: {
      hard: {
        pods: '1',
      },
    },
    status: {
      hard: {
        pods: '1',
      },
      used: {
        pods: '1',
      },
    },
  },
  {
    kind: 'ResourceQuota',
    apiVersion: 'v1',
    metadata: {
      name: 'example1',
      namespace: 'ns1',
      uid: 'aa0ab110-82fa-4ad4-9415-d0f946f2fa91',
      resourceVersion: '68971',
      creationTimestamp: '2022-09-08T04:46:36Z',
    },
    spec: {
      hard: {
        pods: '4',
      },
    },
    status: {
      hard: {
        pods: '4',
      },
      used: {
        pods: '1',
      },
    },
  },
];

export const noResourceAtQuota = [
  {
    kind: 'ResourceQuota',
    apiVersion: 'v1',
    metadata: {
      name: 'example',
      namespace: 'ns1',
      uid: 'aa0ab110-82fa-4ad4-9415-d0f946f2fa90',
      resourceVersion: '68977',
      creationTimestamp: '2022-09-08T04:46:36Z',
    },
    spec: {
      hard: {
        pods: '4',
      },
    },
    status: {
      hard: {
        pods: '4',
      },
      used: {
        pods: '1',
      },
    },
  },
];

export const twoResourceAtQuota = [
  {
    kind: 'ResourceQuota',
    apiVersion: 'v1',
    metadata: {
      name: 'example',
      namespace: 'ns1',
      uid: 'aa0ab110-82fa-4ad4-9415-d0f946f2fa90',
      resourceVersion: '68977',
      creationTimestamp: '2022-09-08T04:46:36Z',
    },
    spec: {
      hard: {
        pods: '1',
      },
    },
    status: {
      hard: {
        pods: '1',
      },
      used: {
        pods: '1',
      },
    },
  },
  {
    kind: 'ResourceQuota',
    apiVersion: 'v1',
    metadata: {
      name: 'example1',
      namespace: 'ns1',
      uid: 'aa0ab110-82fa-4ad4-9415-d0f946f2fa91',
      resourceVersion: '68971',
      creationTimestamp: '2022-09-08T04:46:36Z',
    },
    spec: {
      hard: {
        pods: '1',
      },
    },
    status: {
      hard: {
        pods: '1',
      },
      used: {
        pods: '1',
      },
    },
  },
];
