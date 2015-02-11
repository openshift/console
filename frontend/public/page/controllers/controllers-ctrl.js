angular.module('app')
.controller('ControllersCtrl', function($scope, k8s, arraySvc) {
  'use strict';

  k8s.replicationControllers.list().then(function(rcs) {
    $scope.controllers = rcs;
  });

  $scope.getPods = function(controllerName) {
    var ctrl = k8s.util.findByName($scope.controllers, controllerName);
    k8s.pods.list({ labels: ctrl.spec.replicaSelector })
      .then(function(pods) {
        ctrl.pods = pods;
      });
  };

  $scope.$on(k8s.events.RESOURCE_DELETED, function(e, data) {
    if (data.type === 'replicationController') {
      arraySvc.remove($scope.controllers, data.resource);
    }
  });

});
