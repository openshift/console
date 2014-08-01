angular.module('app')
.controller('MachinesCtrl', function($scope, MachinesSvc) {
  'use strict';

  MachinesSvc.list().then(function(result) {
    $scope.machines = result;
  });

});
