/**
 * @fileoverview
 * List nodes in a table-like view.
 */

angular.module('app.ui')
.directive('coNodeList', function(k8s, _, pkg, arraySvc, resourceMgrSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/node-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      nodes: '=',
      search: '=',
    },
    controller: function($scope) {

      $scope.getStatus = function(node) {
        if (!pkg.propExists('status.conditions', node) || _.isEmpty(node.status.conditions)) {
          return 'Unknown';
        }
        return node.status.conditions[0].status;
      };

      $scope.getPods = function(node) {
        k8s.pods.listByNode(node).then(function(pods) {
          node.pods = pods;
        });
      };

      $scope.$on(k8s.events.RESOURCE_DELETED, function(e, data) {
        if (data.kind === k8s.enum.Kind.NODE) {
          arraySvc.remove($scope.nodes, data.original);
        }
      });

      $scope.$on(k8s.events.RESOURCE_UPDATED, function(e, data) {
        if (data.kind === k8s.enum.Kind.NODE) {
          resourceMgrSvc.updateInList($scope.nodes, data.resource);
        }
      });

    }
  };

});
