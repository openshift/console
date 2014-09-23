angular.module('app')
.controller('EditReplicaControllerCtrl', function(_, $scope, $location, $routeParams, ControllersSvc,
      ModalLauncherSvc) {
  'use strict';

  $scope.replicaController = {};

  $scope.init = function() {
    ControllersSvc.get({ id: $routeParams.id }).then(function(resp) {
      $scope.replicaController = resp.data;
    });
  };

  $scope.openVolumesModal = function() {
    ModalLauncherSvc.open('configure-volumes', {
      pod: $scope.replicaController.desiredState.podTemplate
    });
  };

  $scope.cancel = function() {
    $location.path('/controllers');
  };

  $scope.save = function() {
    $scope.requestPromise = ControllersSvc.update($scope.replicaController);
    $scope.requestPromise.then(function() {
      $location.path('/controllers');
    });
  };

  $scope.init();
})

.controller('EditReplicaControllerFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
