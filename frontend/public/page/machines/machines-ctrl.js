angular.module('app')
.controller('MachinesCtrl', function($scope, k8s) {
  'use strict';

  k8s.nodes.list().then(function(nodes) {
    $scope.machines = nodes;
  });

  $scope.getPods = function(machine) {
    k8s.pods.listByNode(machine).then(function(pods) {
      machine.pods = pods;
    });
  };

});
