angular.module('app')
.controller('NewReplicaControllerCtrl', function(_, $scope, $location, $routeParams, k8s,
      ModalLauncherSvc) {
  'use strict';

  $scope.controller = k8s.replicationControllers.getEmpty();
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
    $scope.requestPromise = k8s.replicationControllers.create($scope.controller);
    $scope.requestPromise.then(function() {
      $location.path('/controllers');
    });
  };

})

.controller('NewReplicaControllerFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
