angular.module('app')
.service('ClusterSvc', function(_, $rootScope) {
  'use strict';

  this.etcd = $rootScope.client.cluster.etcd;

  this.controlServices = $rootScope.client.cluster.controlServices;

  this.controlServiceSummary = function() {
    return this.controlServices().then(function(resp) {
      var svcs = resp.data;
      _.each(svcs, function(svc) {
        if (!svc.stats) {
          svc.stats = {
            running: 0,
            failed: 0,
          };
        }
        _.each(svc.unitStates, function(us) {
          if (us.systemdActiveState === 'active' &&
              us.systemdSubState === 'running') {
            svc.stats.running++;
          } else {
            svc.stats.failed++;
          }
        });
      });

      return svcs;
    });
  };

  this.etcdSummary = function() {
    var unknown = {
      state: 'unknown',
      message: 'Failed to communicate with etcd cluster.',
      count: 0
    };

    return this.etcd().then(function(result) {
      var status;
      status = result.data;

      if (!status.checkSuccess || !status.members) {
        return unknown;
      }

      return {
        state: 'ok',
        message: 'All systems go',
        count: status.members.length
      };

    })
    .catch(function() {
      return unknown;
    });
  };

});
