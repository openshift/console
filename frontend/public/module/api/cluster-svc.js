angular.module('app')
.service('ClusterSvc', function(_, $rootScope) {
  'use strict';

  this.etcd = $rootScope.client.cluster.etcd;

  this.units = $rootScope.client.cluster.units;

  this.unitSummary = function() {
    return this.units().then(function(result) {
      return _.reduce(result.data, function(prev, curr) {
        var result, name;
        name = curr.name
          .replace('kubernetes-', '')
          .replace('.service', '');
        name = _.str.underscored(name);

        if (prev[name]) {
          result = prev[name];
        } else {
          result = {
            running: 0,
            failed: 0
          };
          prev[name] = result;
        }
        if (curr.systemdActiveState === 'active' &&
            curr.systemdSubState === 'running') {
          result.running++;
        } else {
          result.failed++;
        }
        return prev;
      }, {});

    });
  };

  this.etcdSummary = function() {
    var unknown = {
      state: 'unknown',
      message: 'Failed to retrieve etcd data.',
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
        message: 'All systems go.',
        stats: stats,
      };

    })
    .catch(function() {
      return unknown;
    });
  };

});
