angular.module('app')
.service('ControllersSvc', function($rootScope, _, CONST, EVENTS, PodsSvc) {
  'use strict';

  this.list = function(params) {
    return $rootScope.client.replicationControllers.list(params)
      .then(function(result) {
        return result.data.items;
      });
  };

  this.get = function(params) {
    return $rootScope.client.replicationControllers.get(params)
      .then(function(result) {
        return result.data;
      });
  };

  this.find = function(list, id) {
    return _.findWhere(list, { id: id });
  };

  this.create = function(replicaController) {
    //prepareSave(pod);
    return $rootScope.client.replicationControllers.create(replicaController);
  };

  this.getEmptyReplicaController = function() {
    return {
      'id': null,
      'apiVersion': CONST.kubernetesApiVersion,
      'kind': 'ReplicationController',
      'labels': null,
      'desiredState': {
        'replicas': 0,
        'replicaSelector': null,
        'podTemplate': PodsSvc.getEmptyPodTemplate()
      }
    };
  };

  this.delete = function(rc) {
    var p = $rootScope.client.replicationControllers.delete({ id: rc.id });
    p.then(function() {
      // TODO: handle pending delete status.
      $rootScope.$broadcast(EVENTS.CONTROLLER_DELETE, rc);
    });
    return p;
  };

});
