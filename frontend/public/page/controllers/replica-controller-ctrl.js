angular.module('app')
.controller('ReplicaControllerCtrl', function($scope, $routeParams, ControllersSvc, PodsSvc) {
  'use strict';

  ControllersSvc.get({ id: $routeParams.id }).then(function(result) {
    $scope.replicaController = result.data;
    PodsSvc.list({ labels: $scope.replicaController.desiredState.replicaSelector })
      .then(function(result) {
        $scope.pods = result.data.items;
      });
  });

  $scope.getPodTemplateJson = function() {
    if (!$scope.replicaController) {
      return '';
    }
    return JSON.stringify($scope.replicaController.desiredState.podTemplate, null, 2);
  };

});
