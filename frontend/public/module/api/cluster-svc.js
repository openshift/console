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
      stats: {}
    };

    return this.etcd().then(function(result) {
      var status, stats, statsGroup;
      status = result.data;

      if (!status.currentSize || !status.checkSuccess) {
        return unknown;
      }

      statsGroup = _.groupBy(status.machines, 'state');
      stats = {
        active: status.activeSize,
        total: status.currentSize,
        leaders: statsGroup.leader ? statsGroup.leader.length : 0,
        followers: statsGroup.follower ? statsGroup.follower.length : 0,
      };

      if (stats.leaders + stats.followers === 0) {
        return {
          state: 'critical',
          message: 'No active peers found.',
          stats: stats,
        };
      }

      if (stats.leaders === 0) {
        return {
          state: 'warning',
          message: 'Missing leader. Cluster is read-only.',
          stats: stats,
        };
      }

      if (stats.leaders + stats.followers > status.activeSize) {
        return {
          state: 'warning',
          message: 'More active peers than limit',
          stats: stats,
        };
      }

      return {
        state: 'ok',
        message: 'All systems go',
        stats: stats,
      };

    })
    .catch(function() {
      return unknown;
    });
  };

});
