import {wsFactory} from '../ws-factory';
import {k8sKinds} from './enum';

import {k8sCreate, k8sGet, k8sKill, k8sPatch, k8sUpdate, resourceURL, k8sList} from './resource';
import {selectorToString} from './selector';

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
  'StatefulSet',
  'ResourceQuota',
  'TectonicVersion',
].forEach(name => {
  const kind = k8sKinds[name];

  k8s[kind.plural] = {
    kind,
    list: (query) => k8sList(kind, query),
    get: (...args) => k8sGet(kind, ...args),
    delete: (...args) => k8sKill(kind, ...args),
    create: (obj) => k8sCreate(kind, obj),
    update: (obj) => k8sUpdate(kind, obj),
    patch: (obj, payload) => k8sPatch(kind, obj, payload),
    watch: (query) => {
      const queryParams = {watch: true};
      const opts = {queryParams};

      const labelSelector = query.labelSelector || kind.labelSelector;
      if (labelSelector) {
        queryParams.labelSelector = encodeURIComponent(selectorToString(labelSelector));
      }

      if (query.fieldSelector) {
        queryParams.fieldSelector = encodeURIComponent(query.fieldSelector);
      }

      if (query.ns) {
        opts.ns = query.ns;
      }

      const path = resourceURL(kind, opts);
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
