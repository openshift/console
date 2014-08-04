angular.module('app')
.service('MachinesSvc', function(_, $rootScope, PodsSvc) {
  'use strict';

  this.list = function(params) {
    return $rootScope.client.minions.list(params)
      .then(function(result) {
        return result.data.minions;
      });
  };

  this.getPods = function(machine) {
    return PodsSvc.list().then(function(pods) {
      return _.filter(pods, function(p) {
        return p.currentState && p.currentState.host === machine.id;
      });
    });
  };

});
