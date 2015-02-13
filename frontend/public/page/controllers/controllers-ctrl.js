angular.module('app')
.controller('ControllersCtrl', function($scope, k8s, arraySvc) {
  'use strict';

  k8s.replicationControllers.list().then(function(rcs) {
    $scope.rcs = rcs;
  });

  $scope.getPods = function(controllerName) {
    var rc = k8s.util.findByName($scope.rcs, controllerName);
    if (!rc.spec.selector) {
      return;
    }
    k8s.pods.list({ labels: rc.spec.selector })
      .then(function(pods) {
        rc.pods = pods;
      });
  };

  $scope.$on(k8s.events.RESOURCE_DELETED, function(e, data) {
    if (data.kind === k8s.enum.Kind.REPLICATIONCONTROLLER) {
      arraySvc.remove($scope.rcs, data.original);
    }
  });

});
