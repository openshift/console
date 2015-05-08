angular.module('bridge.page')
.controller('ReplicationcontrollerCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns;
  $scope.loadError = false;

  k8s.replicationcontrollers.get($routeParams.name, $scope.ns)
    .then(function(rc) {
      $scope.rc = rc;
      $scope.loadError = false;
    })
    .catch(function() {
      $scope.rc = null;
      $scope.loadError = true;
    });

  $scope.getPodTemplateJson = function() {
    if (!$scope.rc) {
      return '';
    }
    return JSON.stringify($scope.rc.spec.template, null, 2);
  };

});
