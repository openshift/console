angular.module('app')
.controller('ReplicationcontrollerCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  k8s.replicationcontrollers.get($routeParams.name).then(function(rc) {
    $scope.rc = rc;
    k8s.pods.list({ labels: rc.spec.selector })
      .then(function(pods) {
        $scope.pods = pods;
      });
  });

  $scope.getPodTemplateJson = function() {
    if (!$scope.rc) {
      return '';
    }
    return JSON.stringify($scope.rc.spec.template, null, 2);
  };

});
