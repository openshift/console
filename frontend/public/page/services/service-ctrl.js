angular.module('app')
.controller('ServiceCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns;
  $scope.pods = null;

  k8s.services.get($routeParams.name, $scope.ns).then(function(service) {
    $scope.service = service;
    if (!service.spec.selector) {
      $scope.pods = [];
      return;
    }
    k8s.pods.list({ns: $scope.ns, labels: service.spec.selector })
      .then(function(pods) {
        $scope.pods = pods;
      });
  });

});
