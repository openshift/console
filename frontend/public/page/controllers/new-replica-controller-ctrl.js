angular.module('app')
.controller('NewReplicaControllerCtrl', function(_, $scope, $location, $routeParams, ControllersSvc,
      ModalLauncherSvc) {
  'use strict';

  $scope.controller = ControllersSvc.getEmptyReplicaController();
  $scope.podTemplate = $scope.controller.desiredState.podTemplate;

  $scope.openVolumesModal = function() {
    ModalLauncherSvc.open('configure-volumes', {
      pod: $scope.podTemplate
    });
  };

  $scope.cancel = function() {
    $location.path('/controllers');
  };

  $scope.save = function() {
    $scope.requestPromise = ControllersSvc.create($scope.controller);
    $scope.requestPromise.then(function() {
      $location.path('/controllers');
    });
  };

})

.controller('NewReplicaControllerFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
