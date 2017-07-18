import {wsFactory} from '../ws-factory';
import {k8sKinds} from './enum';

import * as k8sDeployments from './deployments';
import * as k8sNodes from './node';
import * as k8sPods from './pods';
import * as k8sReplicaSets from './replicasets';
import * as k8sReplicationControllers from './replicationcontrollers';
import {k8sCreate, k8sGet, k8sKill, k8sList, k8sPatch, k8sUpdate, resourceURL2} from './resource';
import * as k8sServices from './services';

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

const addDefaults = (k8sObject, kind) => {
  return _.assign({
    list: _.partial(k8sList, kind),
    get: _.partial(k8sGet, kind),
    delete: _.partial(k8sKill, kind),
    create: function(obj) {
      k8sObject.clean && k8sObject.clean(obj);
      return k8sCreate(kind, obj);
    },
    update: function(obj) {
      k8sObject.clean && k8sObject.clean(obj);
      return k8sUpdate(kind, obj);
    },
    patch: function (obj, payload) {
      return k8sPatch(kind, obj, payload);
    },
    watch: query => {
      const path = resourceURL2(kind, query.ns, true, query.labelSelector || kind.labelSelector, query.fieldSelector);

      const opts = {
        host: 'auto',
        reconnect: true,
        path: path,
        jsonParse: true,
        bufferEnabled: true,
        bufferFlushInterval: 500,
        bufferMax: 1000,
      };
      return wsFactory(path, opts);
    },
    kind: kind,
  }, k8sObject);
};

export const k8s = {
  configmaps: addDefaults({}, k8sKinds.ConfigMap),
  nodes: addDefaults(k8sNodes, k8sKinds.Node),
  services: addDefaults(k8sServices, k8sKinds.Service),
  pods: addDefaults(k8sPods, k8sKinds.Pod),
  containers: addDefaults({}, k8sKinds.Container),
  replicationcontrollers: addDefaults(k8sReplicationControllers, k8sKinds.ReplicationController),
  replicasets: addDefaults(k8sReplicaSets, k8sKinds.ReplicaSet),
  deployments: addDefaults(k8sDeployments, k8sKinds.Deployment),
  jobs: addDefaults({}, k8sKinds.Job),
  daemonsets: addDefaults({}, k8sKinds.DaemonSet),
  serviceaccounts: addDefaults({}, k8sKinds.ServiceAccount),
  secrets: addDefaults({}, k8sKinds.Secret),
  ingresses: addDefaults({}, k8sKinds.Ingress),
  etcdclusters: addDefaults({}, k8sKinds.EtcdCluster),

  componentstatuses: addDefaults({}, k8sKinds.ComponentStatus),
  namespaces: addDefaults({}, k8sKinds.Namespace),

  clusterrolebindings: addDefaults({}, k8sKinds.ClusterRoleBinding),
  clusterroles: addDefaults({}, k8sKinds.ClusterRole),
  rolebindings: addDefaults({}, k8sKinds.RoleBinding),
  roles: addDefaults({}, k8sKinds.Role),

  tectonicversions: addDefaults({}, k8sKinds.TectonicVersion),
  channeloperatorconfigs: addDefaults({}, k8sKinds.ChannelOperatorConfig),
  appversions: addDefaults({}, k8sKinds.AppVersion),
  networkpolicies: addDefaults({}, k8sKinds.NetworkPolicy),
};
