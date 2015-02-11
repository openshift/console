angular.module('app')
.controller('ContainerCtrl', function($scope, $routeParams, _, k8s) {
  'use strict';

  k8s.pods.get($routeParams.podName).then(function(pod) {
    $scope.pod = pod;
    $scope.container = pod.status.info[$routeParams.name];
    $scope.container.spec = _.findWhere(pod.spec.containers, { name: $routeParams.name });
    $scope.containerState = k8s.docker.getState($scope.container);
  });

});
