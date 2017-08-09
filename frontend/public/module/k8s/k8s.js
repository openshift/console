import {wsFactory} from '../ws-factory';
import {k8sKinds} from './enum';

import {k8sCreate, k8sGet, k8sKill, k8sList, k8sPatch, k8sUpdate, resourceURL2} from './resource';

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
  'TectonicVersion',
].forEach(name => {
  const kind = k8sKinds[name];

  k8s[kind.plural] = {
    kind,
    list: (...args) => k8sList(kind, ...args),
    get: (...args) => k8sGet(kind, ...args),
    delete: (...args) => k8sKill(kind, ...args),
    create: (obj) => k8sCreate(kind, obj),
    update: (obj) => k8sUpdate(kind, obj),
    patch: (obj, payload) => k8sPatch(kind, obj, payload),
    watch: (query) => {
      const path = resourceURL2(kind, query.ns, true, query.labelSelector || kind.labelSelector, query.fieldSelector);
      return wsFactory(path, {
        host: 'auto',
        reconnect: true,
        path: path,
        jsonParse: true,
        bufferEnabled: true,
        bufferFlushInterval: 500,
        bufferMax: 1000,
      });
    },
  };
});

