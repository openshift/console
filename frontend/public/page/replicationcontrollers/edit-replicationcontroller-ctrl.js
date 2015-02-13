angular.module('app')
.controller('EditReplicationcontrollerCtrl', function(_, $scope, $location, $routeParams, k8s, ModalLauncherSvc) {
  'use strict';

  $scope.rc = {};

  $scope.init = function() {
    k8s.replicationcontrollers.get($routeParams.name).then(function(rc) {
      $scope.rc = rc;
    });
  };

  $scope.openVolumesModal = function() {
    ModalLauncherSvc.open('configure-volumes', {
      pod: $scope.rc.spec.template
    });
  };

  $scope.cancel = function() {
    $location.path('/replicationcontrollers');
  };

  $scope.save = function() {
    $scope.requestPromise = k8s.replicationcontrollers.update($scope.rc);
    $scope.requestPromise.then(function() {
      $location.path('/replicationcontrollers');
    });
  };

  $scope.init();
})

.controller('EditReplicationcontrollerFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
