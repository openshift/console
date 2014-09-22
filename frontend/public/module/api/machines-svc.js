angular.module('app')
.service('MachinesSvc', function(_, $rootScope, PodsSvc) {
  'use strict';

  this.list = $rootScope.client.minions.list;

  this.getPods = function(machine) {
    return PodsSvc.list().then(function(podResult) {
      return _.filter(podResult.data.items, function(p) {
        return p.currentState && p.currentState.host === machine.id;
      });
    });
  };

});
