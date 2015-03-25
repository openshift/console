/**
 * @fileoverview
 * List RCs in a table-like view.
 */

angular.module('app.ui')
.directive('coReplicationControllerList', function(k8s, _, arraySvc, resourceMgrSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/replication-controller-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      rcs: '=',
      search: '=',
    },
    controller: function($scope) {

      $scope.getPods = function(rc) {
        k8s.pods.list({ns: rc.metadata.namespace, labels: rc.spec.selector })
          .then(function(pods) {
            rc.pods = pods;
          });
      };

      $scope.$on(k8s.events.RESOURCE_DELETED, function(e, data) {
        if (data.kind === k8s.enum.Kind.REPLICATIONCONTROLLER) {
          arraySvc.remove($scope.rcs, data.original);
        }
      });

      $scope.$on(k8s.events.RESOURCE_UPDATED, function(e, data) {
        if (data.kind === k8s.enum.Kind.REPLICATIONCONTROLLER) {
          resourceMgrSvc.updateInList($scope.rcs, data.resource);
        }
      });

    }
  };

});
