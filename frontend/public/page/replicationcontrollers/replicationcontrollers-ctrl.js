angular.module('app')
.controller('ReplicationcontrollersCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  $scope.defaultNS = k8s.enum.DefaultNS;
  $scope.ns = $routeParams.ns;

  k8s.replicationcontrollers.list({ns: $scope.ns}).then(function(rcs) {
    $scope.rcs = rcs;
  });

});
