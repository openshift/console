import './_module';

import {wsFactory} from '../ws-factory';
import {k8sEnum} from './enum';

import * as k8sCommand from './command';
import * as k8sDeployments from './deployments';
import * as k8sDocker from './docker';
import * as k8sLabels from './labels';
import * as k8sNodes from './node';
import * as k8sPods from './pods';
import * as k8sProbe from './probe';
import * as k8sReplicaSets from './replicasets';
import * as k8sReplicationControllers from './replicationcontrollers';
import * as k8sResource from './resource';
import * as k8sSelector from './selector';
import * as k8sSelectorRequirement from './selector-requirement';
import * as k8sServices from './services';

export const getQN = ({metadata: {name, namespace}}) => (namespace ? `(${namespace})-` : '') + name;

export const k8sBasePath = `${window.SERVER_FLAGS.basePath}api/kubernetes`;

const apiVersion = window.SERVER_FLAGS.k8sAPIVersion;

export const getKubernetesAPIPath = kind => {
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
.service('k8s', function(_, $rootScope) {
  'use strict';
  this.getQN = getQN;
  this.probe = k8sProbe;
  this.selector = k8sSelector;
  this.selectorRequirement = k8sSelectorRequirement;
  this.labels = k8sLabels;
  this.enum = k8sEnum;
  this.docker = k8sDocker;
  this.resource = k8sResource;
  this.command = k8sCommand;

  const addDefaults = (k8sObject, kind) => {
    return _.assign({
      list: _.partial(k8sResource.list, kind),
      get: _.partial(k8sResource.get, kind),
      delete: _.partial(k8sResource.kill, kind),
      create: function(obj) {
        k8sObject.clean && k8sObject.clean(obj);
        return k8sResource.create(kind, obj);
      },
      update: function(obj) {
        k8sObject.clean && k8sObject.clean(obj);
        return k8sResource.update(kind, obj);
      },
      patch: function (obj, payload) {
        return k8sResource.patch(kind, obj, payload);
      },
      watch: query => {
        const path = k8sResource.resourceURL2(kind, query.ns, true, query.labelSelector, query.fieldSelector);

        const opts = {
          scope: $rootScope,
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

  this.kinds = k8sEnum.Kind;
  this.configmaps = addDefaults({}, k8sEnum.Kind.CONFIGMAP);
  this.nodes = addDefaults(k8sNodes, k8sEnum.Kind.NODE);
  this.services = addDefaults(k8sServices, k8sEnum.Kind.SERVICE);
  this.pods = addDefaults(k8sPods, k8sEnum.Kind.POD);
  this.containers = addDefaults({}, k8sEnum.Kind.CONTAINER);
  this.replicationcontrollers = addDefaults(k8sReplicationControllers, k8sEnum.Kind.REPLICATIONCONTROLLER);
  this.replicasets = addDefaults(k8sReplicaSets, k8sEnum.Kind.REPLICASET);
  this.deployments = addDefaults(k8sDeployments, k8sEnum.Kind.DEPLOYMENT);
  this.jobs = addDefaults({}, k8sEnum.Kind.JOB);
  this.daemonsets = addDefaults({}, k8sEnum.Kind.DAEMONSET);
  this.horizontalpodautoscalers = addDefaults({}, k8sEnum.Kind.HORIZONTALPODAUTOSCALER);
  this.serviceaccounts = addDefaults({}, k8sEnum.Kind.SERVICEACCOUNT);
  this.secrets = addDefaults({}, k8sEnum.Kind.SECRET);
  this.ingresses = addDefaults({}, k8sEnum.Kind.INGRESS);

  this.componentstatuses = addDefaults({}, k8sEnum.Kind.COMPONENTSTATUS);
  this.namespaces = addDefaults({}, k8sEnum.Kind.NAMESPACE);

  this.clusterrolebindings = addDefaults({}, k8sEnum.Kind.CLUSTERROLEBINDING);
  this.clusterroles = addDefaults({}, k8sEnum.Kind.CLUSTERROLE);
  this.rolebindings = addDefaults({}, k8sEnum.Kind.ROLEBINDING);
  this.roles = addDefaults({}, k8sEnum.Kind.ROLE);

  this.tectonicversions = addDefaults({}, k8sEnum.Kind.TECTONICVERSION);
  this.channeloperatorconfigs = addDefaults({}, k8sEnum.Kind.CHANNELOPERATORCONFIG);
  this.appversions = addDefaults({}, k8sEnum.Kind.APPVERSION);
  this.basePath = k8sBasePath;
});
