angular.module('app')
.controller('MachinesCtrl', function($scope, _, k8s) {
  'use strict';

  k8s.nodes.list().then(function(nodes) {
    $scope.machines = nodes;
  });

  $scope.getPods = function(machine) {
    k8s.pods.listByNode(machine).then(function(pods) {
      machine.pods = pods;
    });
  };

  $scope.getStatus = function(machine) {
    if (!machine || !machine.status || _.isEmpty(machine.status.conditions)) {
      return 'Unknown';
    }
    return machine.status.conditions[0].status;
  };

});
