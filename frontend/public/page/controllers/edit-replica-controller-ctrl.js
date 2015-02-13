angular.module('app')
.controller('EditReplicaControllerCtrl', function(_, $scope, $location, $routeParams, k8s, ModalLauncherSvc) {
  'use strict';

  $scope.rc = {};

  $scope.init = function() {
    k8s.replicationControllers.get($routeParams.name).then(function(rc) {
      $scope.rc = rc;
    });
  };

  $scope.openVolumesModal = function() {
    ModalLauncherSvc.open('configure-volumes', {
      pod: $scope.rc.spec.template
    });
  };

  $scope.cancel = function() {
    $location.path('/controllers');
  };

  $scope.save = function() {
    $scope.requestPromise = k8s.replicationControllers.update($scope.rc);
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
