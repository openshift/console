angular.module('app')
.controller('ControllerCtrl', function($scope, $routeParams, ControllersSvc, PodsSvc) {
  'use strict';

  ControllersSvc.get({ id: $routeParams.id }).then(function(result) {
    $scope.controller = result.data;
    PodsSvc.list({ labels: $scope.controller.desiredState.replicaSelector })
      .then(function(result) {
        $scope.pods = result.data.items;
      });
  });

  $scope.getPodTemplateJson = function() {
    if (!$scope.controller) {
      return '';
    }
    return JSON.stringify($scope.controller.desiredState.podTemplate, null, 2);
  };

});
