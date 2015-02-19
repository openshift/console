angular.module('app')
.controller('NewReplicationcontrollerCtrl', function(_, $scope, $location, $routeParams, k8s, ModalLauncherSvc) {
  'use strict';

  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.rc = k8s.replicationcontrollers.getEmpty($scope.ns);
  $scope.podTemplate = $scope.rc.spec.template;

  $scope.openVolumesModal = function() {
    ModalLauncherSvc.open('configure-volumes', {
      pod: $scope.podTemplate
    });
  };

  $scope.cancel = function() {
    $location.path('/replicationcontrollers');
  };

  $scope.save = function() {
    $scope.requestPromise = k8s.replicationcontrollers.create($scope.rc);
    $scope.requestPromise.then(function() {
      $location.path('/replicationcontrollers');
    });
  };

})

.controller('NewReplicationcontrollerFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
