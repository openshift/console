angular.module('app')
.controller('PodCtrl', function($scope, $routeParams, PodsSvc) {
  'use strict';

  PodsSvc.get({ id: $routeParams.id }).then(function(result) {
    $scope.pod = result;
  });

  $scope.getContainerState = function(name) {
    return $scope.pod.currentState.info[name];
  };

});
