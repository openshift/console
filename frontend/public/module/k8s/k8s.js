import './_module';
import './docker';
import './enum';
import './events';
import './selector';
import './labels';
import './node';
import './pods';
import './probe';
import './replicationcontrollers';
import './replicasets';
import './deployments';
import './resource';
import './services';
import './util';
import './feature_flags';
import './command';

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
                         k8sPods, k8sServices, k8sDocker, k8sReplicationcontrollers, k8sReplicaSets, k8sDeployments, k8sProbe, k8sNodes, k8sSelector, k8sCommand, featureFlags) {
  'use strict';

  this.probe = k8sProbe;
  this.selector = k8sSelector;
  this.labels = k8sLabels;
  this.events = k8sEvents;
  this.enum = k8sEnum;
  this.docker = k8sDocker;
  this.resource = k8sResource;
  this.search = k8sResource.list;
  this.util = k8sUtil;
  this.command = k8sCommand;
  this.nodes = _.assign(k8sNodes, {
    list: _.partial(k8sResource.list, k8sEnum.Kind.NODE),
    get: _.partial(k8sResource.get, k8sEnum.Kind.NODE),
  });

  this.services = _.assign(k8sServices, {
    list: _.partial(k8sResource.list, k8sEnum.Kind.SERVICE),
    get: _.partial(k8sResource.get, k8sEnum.Kind.SERVICE),
    delete: _.partial(k8sResource.delete, k8sEnum.Kind.SERVICE),
    create: function(svc) {
      k8sServices.clean(svc);
      return k8sResource.create(k8sEnum.Kind.SERVICE, svc);
    },
    update: function(svc) {
      k8sServices.clean(svc);
      return k8sResource.update(k8sEnum.Kind.SERVICE, svc);
    },
  });

  this.pods = _.assign(k8sPods, {
    list: _.partial(k8sResource.list, k8sEnum.Kind.POD),
    get: _.partial(k8sResource.get, k8sEnum.Kind.POD),
    delete: _.partial(k8sResource.delete, k8sEnum.Kind.POD),
    create: function(pod) {
      k8sPods.clean(pod);
      return k8sResource.create(k8sEnum.Kind.POD, pod);
    },
    update: function(pod) {
      k8sPods.clean(pod);
      return k8sResource.update(k8sEnum.Kind.POD, pod);
    },
    log: function(podName, ns) {
      return $http({
        url: k8sResource.resourceURL(k8sEnum.Kind.POD, {ns: ns, name: podName, path: 'log'}),
        method: 'GET',
      })
      .then(function(result) {
        return result.data;
      });
    }
  });

  this.replicationcontrollers = _.assign(k8sReplicationcontrollers, {
    list: _.partial(k8sResource.list, k8sEnum.Kind.REPLICATIONCONTROLLER),
    get: _.partial(k8sResource.get, k8sEnum.Kind.REPLICATIONCONTROLLER),
    delete: _.partial(k8sResource.delete, k8sEnum.Kind.REPLICATIONCONTROLLER),
    create: function(rc) {
      k8sReplicationcontrollers.clean(rc);
      return k8sResource.create(k8sEnum.Kind.REPLICATIONCONTROLLER, rc);
    },
    update: function(rc) {
      k8sReplicationcontrollers.clean(rc);
      return k8sResource.update(k8sEnum.Kind.REPLICATIONCONTROLLER, rc);
    },
  });

  this.replicasets = _.assign(k8sReplicaSets, {
    list: _.partial(k8sResource.list, k8sEnum.Kind.REPLICASET),
    get: _.partial(k8sResource.get, k8sEnum.Kind.REPLICASET),
    delete: _.partial(k8sResource.delete, k8sEnum.Kind.REPLICASET),
    create: function(rc) {
      k8sReplicaSets.clean(rc);
      return k8sResource.create(k8sEnum.Kind.REPLICASET, rc);
    },
    update: function(rc) {
      k8sReplicaSets.clean(rc);
      return k8sResource.update(k8sEnum.Kind.REPLICASET, rc);
    },
  });

  this.deployments = _.assign(k8sDeployments, {
    list: _.partial(k8sResource.list, k8sEnum.Kind.DEPLOYMENT),
    get: _.partial(k8sResource.get, k8sEnum.Kind.DEPLOYMENT),
    delete: _.partial(k8sResource.delete, k8sEnum.Kind.DEPLOYMENT),
    create: function(deployment) {
      k8sDeployments.clean(deployment);
      return k8sResource.create(k8sEnum.Kind.DEPLOYMENT, deployment);
    },
    update: function(deployment) {
      k8sDeployments.clean(deployment);
      return k8sResource.update(k8sEnum.Kind.DEPLOYMENT, deployment);
    },
  });

  this.componentstatuses = {
    list: _.partial(k8sResource.list, k8sEnum.Kind.COMPONENTSTATUS)
  };

  this.namespaces = {
    create: _.partial(k8sResource.create, k8sEnum.Kind.NAMESPACE),
    delete: _.partial(k8sResource.delete, k8sEnum.Kind.NAMESPACE),
    get: _.partial(k8sResource.get, k8sEnum.Kind.NAMESPACE),
    list: _.partial(k8sResource.list, k8sEnum.Kind.NAMESPACE),
  };

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
