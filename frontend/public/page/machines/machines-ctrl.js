angular.module('app')
.controller('MachinesCtrl', function($scope, MachinesSvc) {
  'use strict';

  MachinesSvc.list().then(function(result) {
    $scope.machines = result.data.minions;
  });

  $scope.getPods = function(machine) {
    MachinesSvc.getPods(machine).then(function(pods) {
      machine.pods = pods;
    });
  };

});
