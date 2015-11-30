angular.module('bridge.page')
.controller('ServiceCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns;
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
