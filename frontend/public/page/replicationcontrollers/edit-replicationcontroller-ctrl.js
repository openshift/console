angular.module('bridge.page')
.controller('EditReplicationcontrollerCtrl', function($scope, $location, $routeParams,
                                                      namespacesSvc, _, k8s, ModalLauncherSvc) {
  'use strict';

  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.rcName = $routeParams.name;
  $scope.loadError = false;
  $scope.loaded = false;
  $scope.rc = {};

  k8s.replicationcontrollers.get($routeParams.name, $scope.ns)
    .then(function(rc) {
      $scope.rc = rc;
      $scope.loadError = false;
      $scope.loaded = true;
    })
    .catch(function() {
      $scope.loadError = true;
    });

  $scope.openVolumesModal = function() {
    ModalLauncherSvc.open('configure-volumes', {
      pod: $scope.rc.spec.template
    });
  };

  $scope.cancel = function() {
    $location.path(namespacesSvc.formatNamespaceRoute('/replicationcontrollers'));
  };

  $scope.save = function() {
    $scope.requestPromise = k8s.replicationcontrollers.update($scope.rc);
    $scope.requestPromise.then(function() {
      $location.path(namespacesSvc.formatNamespaceRoute('/replicationcontrollers'));
    });
  };

})

.controller('EditReplicationcontrollerFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
