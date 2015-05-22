angular.module('bridge.page')
.controller('ServicePodsCtrl', function($scope, $routeParams, k8s) {
  'use strict';
  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.serviceName = $routeParams.name;
  $scope.loadError = false;

  k8s.services.get($scope.serviceName, $scope.ns)
    .then(function(service) {
      $scope.service = service;
      $scope.loadError = false;
    })
    .catch(function() {
      $scope.service = null;
      $scope.loadError = true;
    });
});
