angular.module('bridge.page')
.controller('EditReplicaSetCtrl', function($scope, $location, $routeParams,
                                                      activeNamespaceSvc, _, k8s, ModalLauncherSvc) {
  'use strict';

  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.rsName = $routeParams.name;
  $scope.loadError = false;
  $scope.loaded = false;
  $scope.rs = {};

  k8s.replicasets.get($routeParams.name, $scope.ns)
    .then(function(rs) {
      $scope.rs = rs;
      $scope.loadError = false;
      $scope.loaded = true;
    })
    .catch(function() {
      $scope.loadError = true;
    });

  $scope.openVolumesModal = function() {
    ModalLauncherSvc.open('configure-volumes', {
      pod: $scope.rs.spec.template
    });
  };

  $scope.cancel = function() {
    $location.path(activeNamespaceSvc.formatNamespaceRoute('/replicasets'));
  };

  $scope.submit = function() {
    $scope.requestPromise = k8s.replicasets.update($scope.rs);
    $scope.requestPromise.then(function() {
      $location.path(activeNamespaceSvc.formatNamespaceRoute('/replicasets'));
    });
  };
});
