angular.module('app')
.controller('MachineCtrl', function($scope, $routeParams, MachinesSvc) {
  'use strict';

  MachinesSvc.get({ id: $routeParams.id }).then(function(result) {
    $scope.machine = result.data;
    MachinesSvc.getPods($scope.machine).then(function(pods) {
      $scope.machine.pods = pods;
    });
  });

});
