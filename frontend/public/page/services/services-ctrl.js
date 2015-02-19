angular.module('app')
.controller('ServicesCtrl', function($scope, $routeParams, k8s, arraySvc) {
  'use strict';

  $scope.defaultNS = k8s.enum.DefaultNS;
  $scope.ns = $routeParams.ns;

  k8s.services.list({ns: $scope.ns}).then(function(result) {
    $scope.services = result;
  });

  $scope.getPods = function(svc) {
    if (!svc.spec.selector) {
      return;
    }
    k8s.pods.list({ns: svc.metadata.namespace, labels: svc.spec.selector })
      .then(function(pods) {
        svc.pods = pods;
      });
  };

  $scope.$on(k8s.events.RESOURCE_DELETED, function(e, data) {
    if (data.kind === k8s.enum.Kind.SERVICE) {
      arraySvc.remove($scope.services, data.original);
    }
  });

});
