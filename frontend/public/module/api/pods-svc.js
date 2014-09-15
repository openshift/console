angular.module('app')
.service('PodsSvc', function(_, $rootScope, LabelSvc, EVENTS, CONST) {
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

  this.list = function(params) {
    if (params && params.labels) {
      params.labels = LabelSvc.encode(params.labels);
    }
    return $rootScope.client.pods.list(params)
      .then(function(result) {
        return result.data.items;
      });
  };

  this.get = function(params) {
    return $rootScope.client.pods.get(params)
      .then(function(result) {
        return result.data;
      });
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
      $rootScope.$broadcast(EVENTS.POD_DELETE, pod);
    });
    return p;
  };

  this.getEmptyPodTemplate = function() {
    return {
      labels: null,
      desiredState: {
        manifest: {
          version: CONST.kubernetesApiVersion,
          id: null,
          containers: [],
          volumes: null
        }
      }
    };
  };

  this.getEmptyPod = function() {
    var p = this.getEmptyPodTemplate();
    p.id = null;
    return p;
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
