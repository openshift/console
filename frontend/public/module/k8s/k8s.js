import {wsFactory} from '../ws-factory';
import {k8sKinds} from './enum';

import {k8sCreate, k8sGet, k8sKill, k8sPatch, k8sUpdate, resourceURL} from './resource';
import {coFetchJSON} from '../../co-fetch';
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
  'TectonicVersion',
].forEach(name => {
  const kind = k8sKinds[name];

  k8s[kind.plural] = {
    kind,
    list: (params={}) => {
      const query = _(params)
        .omit('ns')
        .map((v, k) => {
          if (k === 'labelSelector') {
            v = selectorToString(v);
          }
          return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
        })
        .value()
        .join('&');

      const k = kind.kind === 'Namespace' ? {
        // hit our custom /namespaces path which better handles users with limited permissions
        basePath: '../../',
        apiVersion: 'tectonic',
        path: 'namespaces',
      } : kind;

      const listURL = resourceURL(k, {ns: params.ns});
      return coFetchJSON(`${listURL}?${query}`).then(result => result.items);
    },
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
