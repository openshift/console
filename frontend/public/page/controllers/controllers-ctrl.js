angular.module('app')
.controller('ControllersCtrl', function($scope, ControllersSvc, PodsSvc) {
  'use strict';

  ControllersSvc.list().then(function(result) {
    $scope.controllers = result;
  });

  $scope.getPods = function(controllerId) {
    var ctrl = ControllersSvc.find($scope.controllers, controllerId);
    PodsSvc.list({ labels: ctrl.desiredState.replicaSelector })
      .then(function(result) {
        ctrl.pods = result;
      });
  };

});
