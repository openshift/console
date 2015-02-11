angular.module('app')
.controller('MachineCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  k8s.nodes.get($routeParams.name).then(function(node) {
    $scope.machine = node;
    k8s.pods.listByNode($scope.machine).then(function(pods) {
      $scope.machine.pods = pods;
    });
  });

});
