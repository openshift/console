// Minimal MachineConfigPool list fixtures for update-modal tests (fields the UI actually reads).

const baseMachineConfigPool = {
  apiVersion: 'machineconfiguration.openshift.io/v1',
  kind: 'MachineConfigPool',
  metadata: {
    name: '',
    creationTimestamp: '2020-08-06T11:52:19Z',
  },
  spec: {
    paused: false,
  },
  status: {
    conditions: [
      {
        status: 'True',
        type: 'Updated',
      },
    ],
  },
};

const masterMachineConfigPool = {
  ...structuredClone(baseMachineConfigPool),
  metadata: {
    name: 'master',
    creationTimestamp: '2020-08-06T11:52:19Z',
  },
};

const workerMachineConfigPool = {
  ...structuredClone(baseMachineConfigPool),
  metadata: {
    name: 'worker',
    creationTimestamp: '2020-08-06T11:52:20Z', // 1 second after master for stable sort order
  },
};

const pausedWorkerMachineConfigPool = {
  ...structuredClone(baseMachineConfigPool),
  metadata: {
    name: 'worker',
    creationTimestamp: '2020-08-06T11:52:20Z',
  },
  spec: {
    paused: true,
  },
};

export const machineConfigPoolListWithPausedWorker = {
  apiVersion: 'machineconfiguration.openshift.io/v1',
  items: [masterMachineConfigPool, pausedWorkerMachineConfigPool],
  kind: 'MachineConfigPoolList',
  metadata: {
    resourceVersion: '1',
  },
};

export const machineConfigPoolListWithUnpausedWorker = {
  apiVersion: 'machineconfiguration.openshift.io/v1',
  items: [masterMachineConfigPool, workerMachineConfigPool],
  kind: 'MachineConfigPoolList',
  metadata: {
    resourceVersion: '1',
  },
};
