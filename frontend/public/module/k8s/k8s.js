import {k8sKinds} from './enum';

import {k8sGet} from './resource';

export const getQN = ({metadata: {name, namespace}}) => (namespace ? `(${namespace})-` : '') + name;

export const k8sBasePath = `${window.SERVER_FLAGS.basePath}api/kubernetes`;

const apiVersion = window.SERVER_FLAGS.k8sAPIVersion;

export const getK8sAPIPath = kind => {
  let p = k8sBasePath;

  if (kind.isExtension) {
    p += '/apis/extensions/';
  } else if (kind.basePath) {
    p += kind.basePath;
  } else {
    p += '/api/';
  }

  p += kind.apiVersion || apiVersion;
  return p;
};

export const k8s = {};

[
  'Alertmanager',
  'AppVersion',
  'ChannelOperatorConfig',
  'ClusterRole',
  'ClusterRoleBinding',
  'ComponentStatus',
  'ConfigMap',
  'Container',
  'DaemonSet',
  'Deployment',
  'EtcdCluster',
  'Ingress',
  'Job',
  'Namespace',
  'NetworkPolicy',
  'Node',
  'PersistentVolume',
  'PersistentVolumeClaim',
  'Pod',
  'Prometheus',
  'ReplicaSet',
  'ReplicationController',
  'Role',
  'RoleBinding',
  'Secret',
  'Service',
  'ServiceAccount',
  'ServiceMonitor',
  'StatefulSet',
  'ResourceQuota',
  'TectonicVersion',
].forEach(name => {
  const kind = k8sKinds[name];

  k8s[kind.plural] = {
    kind,
    get: (...args) => k8sGet(kind, ...args),
  };
});
