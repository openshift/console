angular.module('app')
.controller('PodCtrl', function($scope, $routeParams, PodsSvc) {
  'use strict';

  PodsSvc.get({ id: $routeParams.id }).then(function(result) {
    $scope.pod = result.data;
  });

  $scope.getContainerState = function(name) {
    if ($scope.pod.currentState && $scope.pod.currentState.info) { 
      return $scope.pod.currentState.info[name];
    }
  };

});
