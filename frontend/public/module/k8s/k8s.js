import './_module';
import './docker';
import './enum';
import './events';
import './selector';
import './selector-requirement';
import './labels';
import './node';
import './pods';
import './probe';
import './replicationcontrollers';
import './replicasets';
import './deployments';
import './resource';
import './services';
import './tpm';
import './util';
import './feature_flags';
import './command';
import './configmaps';

angular.module('k8s')
.provider('k8sConfig', function() {
  'use strict';

  var basePath;
  var apiVersion;

  this.setKubernetesPath = function(path, version) {
    basePath = path;
    apiVersion = version;
  };
  this.$get = function() {
    return {
      getKubernetesAPIPath: function(kind) {
        return basePath + (kind.isExtension ? 'apis/extensions/' : 'api/') + (kind.apiVersion || apiVersion);
      },
      getBasePath: function() {
        return basePath;
      },
      getk8sFlagPaths: function () {
        return {
          tpm: '/apis/tpm.coreos.com/v1',
        };
      },
    };
  };
})
.service('k8s', function(_, $http, $timeout, k8sConfig, k8sEvents, k8sEnum, k8sResource, k8sUtil, k8sLabels,
                         k8sPods, k8sServices, k8sDocker, k8sReplicationcontrollers, k8sReplicaSets,
                         k8sDeployments, k8sProbe, k8sNodes, k8sSelector, k8sSelectorRequirement, k8sCommand, featureFlags, tpm, k8sConfigmaps) {
  'use strict';

  this.probe = k8sProbe;
  this.selector = k8sSelector;
  this.selectorRequirement = k8sSelectorRequirement;
  this.labels = k8sLabels;
  this.events = k8sEvents;
  this.enum = k8sEnum;
  this.docker = k8sDocker;
  this.resource = k8sResource;
  this.search = k8sResource.list;
  this.util = k8sUtil;
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
    }, k8sObject);
  }

  const kinds = k8sEnum.Kind;
  this.configmaps = addDefaults(k8sConfigmaps, kinds.CONFIGMAP);
  this.nodes = addDefaults(k8sNodes, kinds.NODE);
  this.policies = addDefaults(tpm, kinds.POLICY);
  this.services = addDefaults(k8sServices, kinds.SERVICE);
  this.pods = addDefaults(k8sPods, k8sEnum.Kind.POD);
  this.replicationcontrollers = addDefaults(k8sReplicationcontrollers, k8sEnum.Kind.REPLICATIONCONTROLLER);
  this.replicasets = addDefaults(k8sReplicaSets, k8sEnum.Kind.REPLICASET);
  this.deployments = addDefaults(k8sDeployments, k8sEnum.Kind.DEPLOYMENT);

  this.componentstatuses = addDefaults({}, k8sEnum.Kind.COMPONENTSTATUS);
  this.namespaces = addDefaults({}, k8sEnum.Kind.NAMESPACE);

  this.health = function() {
    return $http({
      url: k8sConfig.getBasePath(),
      method: 'GET'
    });
  };

  this.version = function() {
    return $http({
      url: k8sConfig.getBasePath() + 'version',
      method: 'GET'
    });
  };

  this.featureDetection = () => {
    $http({
      url: k8sConfig.getBasePath(),
      method: 'GET',
    })
    .then(res => {
      const paths = res.data.paths;
      _.each(k8sConfig.getk8sFlagPaths(), (path, flag) => {
        featureFlags[flag] = paths.indexOf(path) >= 0;
      });
    })
    .catch(e => {
      // eslint-disable-next-line no-console
      console.error(e);
      $timeout(this.featureDetection, 5000);
    });
  };
});
