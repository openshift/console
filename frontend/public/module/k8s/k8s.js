import './_module';

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



angular.module('k8s')
.service('k8s', function(_) {
  'use strict';

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
        const path = resourceURL2(kind, query.ns, true, query.labelSelector, query.fieldSelector);

        const opts = {
          host: 'auto',
          reconnect: true,
          path: path,
          jsonParse: true,
          bufferEnabled: true,
          bufferFlushInterval: 500,
          bufferMax: 1000,
        };
        return wsFactory(kind.labelPlural, opts);
      },
      kind: kind,
    }, k8sObject);
  };

  this.configmaps = addDefaults({}, k8sKinds.CONFIGMAP);
  this.nodes = addDefaults(k8sNodes, k8sKinds.NODE);
  this.services = addDefaults(k8sServices, k8sKinds.SERVICE);
  this.pods = addDefaults(k8sPods, k8sKinds.POD);
  this.containers = addDefaults({}, k8sKinds.CONTAINER);
  this.replicationcontrollers = addDefaults(k8sReplicationControllers, k8sKinds.REPLICATIONCONTROLLER);
  this.replicasets = addDefaults(k8sReplicaSets, k8sKinds.REPLICASET);
  this.deployments = addDefaults(k8sDeployments, k8sKinds.DEPLOYMENT);
  this.jobs = addDefaults({}, k8sKinds.JOB);
  this.daemonsets = addDefaults({}, k8sKinds.DAEMONSET);
  this.horizontalpodautoscalers = addDefaults({}, k8sKinds.HORIZONTALPODAUTOSCALER);
  this.serviceaccounts = addDefaults({}, k8sKinds.SERVICEACCOUNT);
  this.secrets = addDefaults({}, k8sKinds.SECRET);
  this.ingresses = addDefaults({}, k8sKinds.INGRESS);

  this.componentstatuses = addDefaults({}, k8sKinds.COMPONENTSTATUS);
  this.namespaces = addDefaults({}, k8sKinds.NAMESPACE);

  this.clusterrolebindings = addDefaults({}, k8sKinds.CLUSTERROLEBINDING);
  this.clusterroles = addDefaults({}, k8sKinds.CLUSTERROLE);
  this.rolebindings = addDefaults({}, k8sKinds.ROLEBINDING);
  this.roles = addDefaults({}, k8sKinds.ROLE);

  this.tectonicversions = addDefaults({}, k8sKinds.TECTONICVERSION);
  this.channeloperatorconfigs = addDefaults({}, k8sKinds.CHANNELOPERATORCONFIG);
  this.appversions = addDefaults({}, k8sKinds.APPVERSION);
});
