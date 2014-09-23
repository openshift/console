angular.module('app')
.service('ControllersSvc', function($rootScope, _, CONST, EVENTS, PodsSvc) {
  'use strict';

  this.list = $rootScope.client.replicationControllers.list;
  this.create = $rootScope.client.replicationControllers.create;
  this.get = $rootScope.client.replicationControllers.get;

  this.update = function(replicaController) {
    // Add id for the path property.
    return $rootScope.client.replicationControllers.update(
      _.extend(replicaController, { controllerId: replicaController.id }));
  };

  this.find = function(list, id) {
    return _.findWhere(list, { id: id });
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
