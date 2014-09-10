angular.module('app')
.controller('ContainerCtrl', function($scope, $routeParams, _, PodsSvc) {
  'use strict';

  PodsSvc.get({ id: $routeParams.podId }).then(function(result) {
    var container;
    $scope.pod = result;
    container = _.findWhere($scope.pod.desiredState.manifest.containers, { name: $routeParams.name });
    if ($scope.pod.currentState && $scope.pod.currentState.info &&
        $scope.pod.currentState.info[$routeParams.name]) {
      _.extend(container, $scope.pod.currentState.info[$routeParams.name]);
    }
    $scope.container = container;
  });

  $scope.getState = function() {
    var state = '';
    if (!$scope.container) {
      return state;
    }
    if (!$scope.container.State) {
      state = 'Unknown';
    } else if ($scope.container.State.Running) {
      state = 'Running';
    } else {
      state = 'Not Running';
    }
    return state;
  };

});
