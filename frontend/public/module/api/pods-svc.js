angular.module('app')
.service('PodsSvc', function(_, $rootScope, LabelSvc, EVENTS) {
  'use strict';

  // Nullify empty fields & prep volumes.
  function prepareSave(pod) {
    var m = pod.desiredState.manifest;

    _.each(m.containers, function(c) {
      if (_.isEmpty(c.ports)) {
        c.ports = null;
      }
      if (_.isEmpty(c.volumeMounts)) {
        c.volumeMounts = null;
      }
    });
  }

  this.get = $rootScope.client.pods.get;

  this.list = function(params) {
    if (params && params.labels) {
      params.labels = LabelSvc.urlEncode(params.labels);
    }
    return $rootScope.client.pods.list(params);
  };

  this.find = function(list, id) {
    return _.findWhere(list, { id: id });
  };

  this.create = function(pod) {
    prepareSave(pod);
    return $rootScope.client.pods.create(pod);
  };

  this.delete = function(pod) {
    var p = $rootScope.client.pods.delete({ id: pod.id });
    p.then(function() {
      // TODO: handle pending delete status.
      // TODO: generalize this interception.
      $rootScope.$broadcast(EVENTS.POD_DELETE, pod);
    });
    return p;
  };

  this.getEmptyPodTemplate = function() {
    return {
      kind: 'Pod',
      apiVersion: $rootScope.SERVER_FLAGS.k8sVersion,
      labels: null,
      desiredState: {
        manifest: {
          version: $rootScope.SERVER_FLAGS.k8sVersion,
          id: null,
          containers: [],
          volumes: null
        }
      }
    };
  };

  this.getEmptyVolume = function() {
    return {
      name: null,
      source: {
        hostDir: {
          path: null
        },
        emptyDir: null
      }
    };
  };

  this.getEmptyVolumeMount = function() {
    return {
      name: null,
      mountPath: null,
      readOnly: false,
    };
  };

  this.getEmptyPod = function() {
    var p = this.getEmptyPodTemplate();
    p.id = null;
    return p;
  };

  this.getEmptyEnvVar = function() {
    return {
      name: null,
      value: null,
    };
  };

  this.getEmptyPort = function() {
    return {
      hostPort: null,
      containerPort: null,
      name: null,
      protocol: 'TCP',
    };
  };

  this.getEmptyContainer = function() {
    return {
      name: null,
      image: null,
      ports: null,
      env: null,
      volumeMounts: null
    };
  };

});
