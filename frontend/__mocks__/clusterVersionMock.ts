import { ClusterVersionKind, ListKind, MachineConfigPoolKind } from '../public/module/k8s';

export const clusterVersionProps: ClusterVersionKind = {
  apiVersion: 'config.openshift.io/v1',
  kind: 'ClusterVersion',
  metadata: {
    creationTimestamp: '2020-08-05T17:21:42Z',
    generation: 1,
    name: 'version',
    resourceVersion: '22513',
    selfLink: '/apis/config.openshift.io/v1/clusterversions/version',
    uid: '21194fa6-7058-47cb-9d45-782a666dd146',
  },
  spec: {
    channel: 'stable-4.5',
    clusterID: '727841c6-242d-4592-90d1-699925c4cfba',
    upstream: 'https://api.openshift.com/api/upgrades_info/v1/graph',
  },
  status: {
    availableUpdates: [
      {
        force: false,
        image:
          'quay.io/openshift-release-dev/ocp-release@sha256:02dfcae8f6a67e715380542654c952c981c59604b1ba7f569b13b9e5d0fbbed3',
        version: '4.5.4',
      },
    ],
    conditions: [
      {
        lastTransitionTime: '2020-08-05T17:49:47Z',
        message: 'Done applying 4.5.2',
        status: 'True',
        type: 'Available',
      },
      {
        lastTransitionTime: '2020-08-05T17:34:57Z',
        status: 'False',
        type: 'Failing',
      },
      {
        lastTransitionTime: '2020-08-05T17:49:47Z',
        message: 'Cluster version is 4.5.2',
        status: 'False',
        type: 'Progressing',
      },
      {
        lastTransitionTime: '2020-08-05T17:21:48Z',
        status: 'True',
        type: 'RetrievedUpdates',
      },
    ],
    desired: {
      force: false,
      image:
        'registry.svc.ci.openshift.org/ocp/release@sha256:8f923b7b8efdeac619eb0e7697106c1d17dd3d262c49d8742b38600417cf7d1d',
      version: '4.5.2',
    },
    history: [
      {
        completionTime: '2020-08-05T17:49:47Z',
        image:
          'registry.svc.ci.openshift.org/ocp/release@sha256:8f923b7b8efdeac619eb0e7697106c1d17dd3d262c49d8742b38600417cf7d1d',
        startedTime: '2020-08-05T17:21:48Z',
        state: 'Completed',
        verified: false,
        version: '4.5.2',
      },
    ],
    observedGeneration: 1,
    versionHash: 'yHX6PmE5llA=',
  },
};

export const clusterVersionUpdatingProps: ClusterVersionKind = {
  apiVersion: 'config.openshift.io/v1',
  kind: 'ClusterVersion',
  metadata: {
    creationTimestamp: '2020-08-05T17:21:42Z',
    generation: 2,
    name: 'version',
    resourceVersion: '88518',
    selfLink: '/apis/config.openshift.io/v1/clusterversions/version',
    uid: '21194fa6-7058-47cb-9d45-782a666dd146',
  },
  spec: {
    channel: 'stable-4.5',
    clusterID: '727841c6-242d-4592-90d1-699925c4cfba',
    desiredUpdate: {
      force: false,
      image:
        'quay.io/openshift-release-dev/ocp-release@sha256:02dfcae8f6a67e715380542654c952c981c59604b1ba7f569b13b9e5d0fbbed3',
      version: '4.5.4',
    },
    upstream: 'https://api.openshift.com/api/upgrades_info/v1/graph',
  },
  status: {
    availableUpdates: [
      {
        force: false,
        image:
          'quay.io/openshift-release-dev/ocp-release@sha256:02dfcae8f6a67e715380542654c952c981c59604b1ba7f569b13b9e5d0fbbed3',
        version: '4.5.4',
      },
    ],
    conditions: [
      {
        lastTransitionTime: '2020-08-05T17:49:47Z',
        message: 'Done applying 4.5.2',
        status: 'True',
        type: 'Available',
      },
      {
        lastTransitionTime: '2020-08-05T17:34:57Z',
        status: 'False',
        type: 'Failing',
      },
      {
        lastTransitionTime: '2020-08-05T21:09:02Z',
        message: 'Working towards 4.5.4: 1% complete',
        status: 'True',
        type: 'Progressing',
      },
      {
        lastTransitionTime: '2020-08-05T17:21:48Z',
        status: 'True',
        type: 'RetrievedUpdates',
      },
    ],
    desired: {
      force: false,
      image:
        'quay.io/openshift-release-dev/ocp-release@sha256:02dfcae8f6a67e715380542654c952c981c59604b1ba7f569b13b9e5d0fbbed3',
      version: '4.5.4',
    },
    history: [
      {
        completionTime: null,
        image:
          'quay.io/openshift-release-dev/ocp-release@sha256:02dfcae8f6a67e715380542654c952c981c59604b1ba7f569b13b9e5d0fbbed3',
        startedTime: '2020-08-05T21:09:02Z',
        state: 'Partial',
        verified: true,
        version: '4.5.4',
      },
      {
        completionTime: '2020-08-05T17:49:47Z',
        image:
          'registry.svc.ci.openshift.org/ocp/release@sha256:8f923b7b8efdeac619eb0e7697106c1d17dd3d262c49d8742b38600417cf7d1d',
        startedTime: '2020-08-05T17:21:48Z',
        state: 'Completed',
        verified: false,
        version: '4.5.2',
      },
    ],
    observedGeneration: 2,
    versionHash: 'qSkCqxZtYDI=',
  },
};

export const clusterVersionUpdatedProps: ClusterVersionKind = {
  apiVersion: 'config.openshift.io/v1',
  kind: 'ClusterVersion',
  metadata: {
    creationTimestamp: '2020-08-06T11:42:52Z',
    generation: 2,
    name: 'version',
    resourceVersion: '80882',
    selfLink: '/apis/config.openshift.io/v1/clusterversions/version',
    uid: '3c79e278-3e59-4438-92c8-1125bbf41a6c',
  },
  spec: {
    channel: 'stable-4.5',
    clusterID: '94ffb461-7099-4064-b628-8526b35a6389',
    desiredUpdate: {
      force: false,
      image:
        'quay.io/openshift-release-dev/ocp-release@sha256:02dfcae8f6a67e715380542654c952c981c59604b1ba7f569b13b9e5d0fbbed3',
      version: '4.5.4',
    },
    upstream: 'https://api.openshift.com/api/upgrades_info/v1/graph',
  },
  status: {
    availableUpdates: null,
    conditions: [
      {
        lastTransitionTime: '2020-08-06T12:10:18Z',
        message: 'Done applying 4.5.4',
        status: 'True',
        type: 'Available',
      },
      {
        lastTransitionTime: '2020-08-06T14:27:34Z',
        status: 'False',
        type: 'Failing',
      },
      {
        lastTransitionTime: '2020-08-06T14:28:34Z',
        message: 'Cluster version is 4.5.4',
        status: 'False',
        type: 'Progressing',
      },
      {
        lastTransitionTime: '2020-08-06T11:42:57Z',
        status: 'True',
        type: 'RetrievedUpdates',
      },
    ],
    desired: {
      force: false,
      image:
        'quay.io/openshift-release-dev/ocp-release@sha256:02dfcae8f6a67e715380542654c952c981c59604b1ba7f569b13b9e5d0fbbed3',
      version: '4.5.4',
    },
    history: [
      {
        completionTime: '2020-08-06T14:28:34Z',
        image:
          'quay.io/openshift-release-dev/ocp-release@sha256:02dfcae8f6a67e715380542654c952c981c59604b1ba7f569b13b9e5d0fbbed3',
        startedTime: '2020-08-06T13:54:57Z',
        state: 'Completed',
        verified: true,
        version: '4.5.4',
      },
      {
        completionTime: '2020-08-06T12:10:18Z',
        image:
          'registry.svc.ci.openshift.org/ocp/release@sha256:8f923b7b8efdeac619eb0e7697106c1d17dd3d262c49d8742b38600417cf7d1d',
        startedTime: '2020-08-06T11:42:57Z',
        state: 'Completed',
        verified: false,
        version: '4.5.2',
      },
    ],
    observedGeneration: 2,
    versionHash: 'qSkCqxZtYDI=',
  },
};

export const workerMachineConfigPoolProp: MachineConfigPoolKind = {
  apiVersion: 'machineconfiguration.openshift.io/v1',
  kind: 'MachineConfigPool',
  metadata: {
    creationTimestamp: '2020-08-06T11:52:19Z',
    generation: 3,
    labels: { 'machineconfiguration.openshift.io/mco-built-in': '' },
    name: 'worker',
    resourceVersion: '79610',
    selfLink: '/apis/machineconfiguration.openshift.io/v1/machineconfigpools/worker',
    uid: '195b087d-796f-4970-bbf9-bdf3d8989f14',
  },
  spec: {
    configuration: {
      name: 'rendered-worker-8fcfc03c3e3b9ad41853868d06b8b116',
      source: [
        {
          apiVersion: 'machineconfiguration.openshift.io/v1',
          kind: 'MachineConfig',
          name: '00-worker',
        },
        {
          apiVersion: 'machineconfiguration.openshift.io/v1',
          kind: 'MachineConfig',
          name: '01-worker-container-runtime',
        },
        {
          apiVersion: 'machineconfiguration.openshift.io/v1',
          kind: 'MachineConfig',
          name: '01-worker-kubelet',
        },
        {
          apiVersion: 'machineconfiguration.openshift.io/v1',
          kind: 'MachineConfig',
          name: '99-worker-195b087d-796f-4970-bbf9-bdf3d8989f14-registries',
        },
        {
          apiVersion: 'machineconfiguration.openshift.io/v1',
          kind: 'MachineConfig',
          name: '99-worker-ssh',
        },
      ],
    },
    machineConfigSelector: {
      matchLabels: { 'machineconfiguration.openshift.io/role': 'worker' },
    },
    nodeSelector: { matchLabels: { 'node-role.kubernetes.io/worker': '' } },
    paused: false,
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2020-08-06T11:53:11Z',
        message: '',
        reason: '',
        status: 'False',
        type: 'RenderDegraded',
      },
      {
        lastTransitionTime: '2020-08-06T11:53:15Z',
        message: '',
        reason: '',
        status: 'False',
        type: 'NodeDegraded',
      },
      {
        lastTransitionTime: '2020-08-06T11:53:15Z',
        message: '',
        reason: '',
        status: 'False',
        type: 'Degraded',
      },
      {
        lastTransitionTime: '2020-08-06T14:25:56Z',
        message: 'All nodes are updated with rendered-worker-8fcfc03c3e3b9ad41853868d06b8b116',
        reason: '',
        status: 'True',
        type: 'Updated',
      },
      {
        lastTransitionTime: '2020-08-06T14:25:56Z',
        message: '',
        reason: '',
        status: 'False',
        type: 'Updating',
      },
    ],
    configuration: {
      name: 'rendered-worker-8fcfc03c3e3b9ad41853868d06b8b116',
      source: [
        {
          apiVersion: 'machineconfiguration.openshift.io/v1',
          kind: 'MachineConfig',
          name: '00-worker',
        },
        {
          apiVersion: 'machineconfiguration.openshift.io/v1',
          kind: 'MachineConfig',
          name: '01-worker-container-runtime',
        },
        {
          apiVersion: 'machineconfiguration.openshift.io/v1',
          kind: 'MachineConfig',
          name: '01-worker-kubelet',
        },
        {
          apiVersion: 'machineconfiguration.openshift.io/v1',
          kind: 'MachineConfig',
          name: '99-worker-195b087d-796f-4970-bbf9-bdf3d8989f14-registries',
        },
        {
          apiVersion: 'machineconfiguration.openshift.io/v1',
          kind: 'MachineConfig',
          name: '99-worker-ssh',
        },
      ],
    },
    degradedMachineCount: 0,
    machineCount: 3,
    observedGeneration: 3,
    readyMachineCount: 3,
    unavailableMachineCount: 0,
    updatedMachineCount: 3,
  },
};

export const machineConfigPoolsProps: ListKind<MachineConfigPoolKind> = {
  apiVersion: 'machineconfiguration.openshift.io/v1',
  items: [
    {
      apiVersion: 'machineconfiguration.openshift.io/v1',
      kind: 'MachineConfigPool',
      metadata: {
        creationTimestamp: '2020-08-06T11:52:19Z',
        generation: 3,
        labels: {
          'machineconfiguration.openshift.io/mco-built-in': '',
          'operator.machineconfiguration.openshift.io/required-for-upgrade': '',
        },
        name: 'master',
        resourceVersion: '80196',
        selfLink: '/apis/machineconfiguration.openshift.io/v1/machineconfigpools/master',
        uid: 'c34d2940-6dfb-4196-966f-4617e508fdbd',
      },
      spec: {
        configuration: {
          name: 'rendered-master-9ca9eaaebe062d1f20232f7b7b9e4456',
          source: [
            {
              apiVersion: 'machineconfiguration.openshift.io/v1',
              kind: 'MachineConfig',
              name: '00-master',
            },
            {
              apiVersion: 'machineconfiguration.openshift.io/v1',
              kind: 'MachineConfig',
              name: '01-master-container-runtime',
            },
            {
              apiVersion: 'machineconfiguration.openshift.io/v1',
              kind: 'MachineConfig',
              name: '01-master-kubelet',
            },
            {
              apiVersion: 'machineconfiguration.openshift.io/v1',
              kind: 'MachineConfig',
              name: '99-master-c34d2940-6dfb-4196-966f-4617e508fdbd-registries',
            },
            {
              apiVersion: 'machineconfiguration.openshift.io/v1',
              kind: 'MachineConfig',
              name: '99-master-ssh',
            },
          ],
        },
        machineConfigSelector: {
          matchLabels: { 'machineconfiguration.openshift.io/role': 'master' },
        },
        nodeSelector: { matchLabels: { 'node-role.kubernetes.io/master': '' } },
        paused: false,
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2020-08-06T11:53:11Z',
            message: '',
            reason: '',
            status: 'False',
            type: 'RenderDegraded',
          },
          {
            lastTransitionTime: '2020-08-06T11:53:38Z',
            message: '',
            reason: '',
            status: 'False',
            type: 'NodeDegraded',
          },
          {
            lastTransitionTime: '2020-08-06T11:53:38Z',
            message: '',
            reason: '',
            status: 'False',
            type: 'Degraded',
          },
          {
            lastTransitionTime: '2020-08-06T14:27:00Z',
            message: 'All nodes are updated with rendered-master-9ca9eaaebe062d1f20232f7b7b9e4456',
            reason: '',
            status: 'True',
            type: 'Updated',
          },
          {
            lastTransitionTime: '2020-08-06T14:27:00Z',
            message: '',
            reason: '',
            status: 'False',
            type: 'Updating',
          },
        ],
        configuration: {
          name: 'rendered-master-9ca9eaaebe062d1f20232f7b7b9e4456',
          source: [
            {
              apiVersion: 'machineconfiguration.openshift.io/v1',
              kind: 'MachineConfig',
              name: '00-master',
            },
            {
              apiVersion: 'machineconfiguration.openshift.io/v1',
              kind: 'MachineConfig',
              name: '01-master-container-runtime',
            },
            {
              apiVersion: 'machineconfiguration.openshift.io/v1',
              kind: 'MachineConfig',
              name: '01-master-kubelet',
            },
            {
              apiVersion: 'machineconfiguration.openshift.io/v1',
              kind: 'MachineConfig',
              name: '99-master-c34d2940-6dfb-4196-966f-4617e508fdbd-registries',
            },
            {
              apiVersion: 'machineconfiguration.openshift.io/v1',
              kind: 'MachineConfig',
              name: '99-master-ssh',
            },
          ],
        },
        degradedMachineCount: 0,
        machineCount: 3,
        observedGeneration: 3,
        readyMachineCount: 3,
        unavailableMachineCount: 0,
        updatedMachineCount: 3,
      },
    },
    { ...workerMachineConfigPoolProp },
  ],
  kind: 'MachineConfigPoolList',
  metadata: {
    resourceVersion: '167399',
    selfLink: '/apis/machineconfiguration.openshift.io/v1/machineconfigpools',
  },
};
