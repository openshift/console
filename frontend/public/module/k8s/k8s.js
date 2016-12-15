import './_module';
import './node';
import './pods';
import './probe';
import './replicationcontrollers';
import './replicasets';
import './deployments';
import './resource';
import './services';

import {coFetchJSON} from '../../co-fetch';
import {wsFactory} from '../ws-factory';
import {k8sEnum} from './enum';

import * as k8sCommand from './command';
import * as k8sDocker from './docker';
import k8sEvents from './events';
import * as k8sLabels from './labels';
import * as k8sSelector from './selector';
import * as k8sSelectorRequirement from './selector-requirement';

export const getQN = ({metadata: {name, namespace}}) => (namespace ? `(${namespace})-` : '') + name;

const basePath = `${window.SERVER_FLAGS.basePath}api/kubernetes`;
const apiVersion = window.SERVER_FLAGS.k8sAPIVersion;

const coreosBasePath = `${basePath}/apis/coreos.com/v1`;

export const getKubernetesAPIPath = kind => {
  let p = basePath;

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

const k8sFlagPaths = {
  rbac: '/apis/rbac.authorization.k8s.io',
  rbacV1alpha1: '/apis/rbac.authorization.k8s.io/v1alpha1'
};

const coreosFlagNames = {
  clusterUpdates: 'channeloperatorconfigs'
};


angular.module('k8s')
.service('k8s', function(_, $timeout, $rootScope, k8sResource,
                         k8sPods, k8sServices, k8sReplicationcontrollers, k8sReplicaSets,
                         k8sDeployments, k8sProbe, k8sNodes, featuresSvc) {
  'use strict';
  this.getQN = getQN;
  this.probe = k8sProbe;
  this.selector = k8sSelector;
  this.selectorRequirement = k8sSelectorRequirement;
  this.labels = k8sLabels;
  this.events = k8sEvents;
  this.enum = k8sEnum;
  this.docker = k8sDocker;
  this.resource = k8sResource;
  this.search = k8sResource.list;
  this.command = k8sCommand;

  const addDefaults = (k8sObject, kind) => {
    return _.assign({
      list: _.partial(k8sResource.list, kind),
      get: _.partial(k8sResource.get, kind),
      delete: _.partial(k8sResource.delete, kind),
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
  this.replicationcontrollers = addDefaults(k8sReplicationcontrollers, k8sEnum.Kind.REPLICATIONCONTROLLER);
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
  this.basePath = basePath;

  this.health = () => coFetchJSON(basePath);
  this.version = () => coFetchJSON(`${basePath}/version`);

  this.featureDetection = () => {
    coFetchJSON(basePath)
    .then(res => {
      _.each(k8sFlagPaths, (path, flag) => {
        featuresSvc[flag] = res.paths.indexOf(path) >= 0;
      });
    })
    .catch(() => {
      $timeout(this.featureDetection, 5000);
    });

    coFetchJSON(coreosBasePath)
    .then(res => {
      _.each(coreosFlagNames, (name, flag) => {
        featuresSvc[flag] = _.find(res.resources, {name});
      });
    })
    .catch(() => {
      $timeout(this.featureDetection, 5000);
    });
  };
});
