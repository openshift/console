angular.module('app')
.controller('PodCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  k8s.pods.get($routeParams.name).then(function(pod) {
    $scope.pod = pod;
  });

  $scope.getContainerState = function(container) {
    return k8s.docker.getState(container);
  };

});
