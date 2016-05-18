angular.module('bridge.service')
.factory('statusSvc', function(_, $http, k8s) {
  'use strict';

  var attemptToUpdateKnownComponent = function(status, component, name) {
    if (status[name]) {
      throw 'The Kubernetes API returned multiple values for the same component';
    }
    if (!component) {
      throw 'The Kubernetes API has not reported on a required component';
    }
    if (!component.healthConditions) {
      throw 'The Kubernetes API is missing health information for a component';
    }
    if (component.healthConditions.length !== 1) {
      throw 'The Kubernetes API has returned a health status response that this console does not support';
    }

    component.health = component.healthConditions[0];
    status[name] = component;
  };

  return {
    health: function() {
      return $http({
        url: '/health',
        method: 'GET',
      });
    },
    tectonicVersion: function() {
      return $http({
        url: '/version',
        method: 'GET',
      });
    },
    healthKubernetesApi: function() {
      return k8s.health();
    },
    kubernetesVersion: function() {
      return k8s.version();
    },
    componentStatus: function() {
      return k8s.componentstatuses.list().then(function(items) {
        var etcds = [];
        var ret = {
          etcdInfo: {
            running: 0,
            failed: 0,
            unknown: 0
          }
        };

        angular.forEach(items, function(component) {
          component.healthConditions = _.filter(component.conditions, {type: 'Healthy'});

          if (component.metadata.name === 'controller-manager') {
            attemptToUpdateKnownComponent(ret, component, 'controllerManager');
          } else if (component.metadata.name === 'scheduler') {
            attemptToUpdateKnownComponent(ret, component, 'scheduler');
          } else if (component.metadata.name.match(/^etcd-\d+$/)) {
            etcds.push(component);
          }
        });

        angular.forEach(etcds, function(component) {
          var running = _.filter(component.healthConditions, {type: 'Healthy', status: 'True'}).length;
          var failed = _.filter(component.healthConditions, {type: 'Healthy', status: 'False'}).length;
          ret.etcdInfo.running += running;
          ret.etcdInfo.failed += failed;
          ret.etcdInfo.unknown += component.healthConditions.length - (running + failed);
        });

        ret.etcdInfo.total = ret.etcdInfo.running + ret.etcdInfo.failed + ret.etcdInfo.unknown;

        return ret;
      });
    }
  };
});
