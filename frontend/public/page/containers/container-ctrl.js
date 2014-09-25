angular.module('app')
.controller('ContainerCtrl', function($scope, $routeParams, _, PodsSvc, ModalLauncherSvc) {
  'use strict';

  PodsSvc.get({ id: $routeParams.podId }).then(function(result) {
    $scope.pod = result.data;
    $scope.container = _.findWhere($scope.pod.desiredState.manifest.containers, { name: $routeParams.name });
    if ($scope.pod.currentState && $scope.pod.currentState.info &&
        $scope.pod.currentState.info[$routeParams.name]) {
      _.extend($scope.container, $scope.pod.currentState.info[$routeParams.name]);
    }
  });

  $scope.openJsonModal = function() {
    ModalLauncherSvc.open('view-json', {
      title: 'Raw Container Data',
      json: $scope.container,
    });
  };

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
