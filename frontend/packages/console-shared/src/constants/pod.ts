import {
  DeploymentModel,
  DaemonSetModel,
  StatefulSetModel,
  DeploymentConfigModel,
} from '@console/internal/models';

export const podColor = {
  Running: '#0066CC',
  'Not Ready': '#519DE9',
  Warning: '#F0AB00',
  Empty: '#FFFFFF',
  Failed: '#CC0000',
  Pending: '#8BC1F7',
  Succeeded: '#519149',
  Terminating: '#002F5D',
  Unknown: '#A18FFF',
  'Scaled to 0': '#FFFFFF',
  Idle: '#FFFFFF',
  'Autoscaled to 0': '#FFFFFF',
};

export const deploymentKindMap = {
  deployments: {
    dcKind: DeploymentModel.kind,
    rcKind: 'ReplicaSet',
    rController: 'replicaSets',
  },
  daemonSets: {
    dcKind: DaemonSetModel.kind,
    rcKind: 'ReplicaSet',
    rController: 'replicaSets',
  },
  statefulSets: {
    dcKind: StatefulSetModel.kind,
    rcKind: 'ReplicaSet',
    rController: 'replicaSets',
  },
  deploymentConfigs: {
    dcKind: DeploymentConfigModel.kind,
    rcKind: 'ReplicationController',
    rController: 'replicationControllers',
  },
};
