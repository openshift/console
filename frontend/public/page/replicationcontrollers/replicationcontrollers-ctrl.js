angular.module('app')
.controller('ReplicationcontrollersCtrl', function($scope, $routeParams, k8s, arraySvc, resourceMgrSvc) {
  'use strict';

  $scope.defaultNS = k8s.enum.DefaultNS;
  $scope.ns = $routeParams.ns;

  k8s.replicationcontrollers.list({ns: $scope.ns}).then(function(rcs) {
    $scope.rcs = rcs;
  });

  $scope.getPods = function(rc) {
    if (!rc.spec.selector) {
      return;
    }
    k8s.pods.list({ns: rc.metadata.namespace, labels: rc.spec.selector })
      .then(function(pods) {
        rc.pods = pods;
      });
  };

  $scope.$on(k8s.events.RESOURCE_DELETED, function(e, data) {
    if (data.kind === k8s.enum.Kind.REPLICATIONCONTROLLER) {
      arraySvc.remove($scope.rcs, data.original);
    }
  });

  $scope.$on(k8s.events.RESOURCE_UPDATED, function(e, data) {
    if (data.kind === k8s.enum.Kind.REPLICATIONCONTROLLER) {
      resourceMgrSvc.updateInList($scope.rcs, data.resource);
    }
  });

});
