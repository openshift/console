/**
 * @fileoverview
 * List RCs in a table-like view.
 */

angular.module('bridge.ui')
.directive('coReplicationControllerList', function(k8s, _, arraySvc, resourceMgrSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/replication-controller-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      namespace: '=',
      search: '=',
      selector: '=',
      load: '=',
    },
    controller: function($scope, $attrs) {
      $scope.rcs = null;
      $scope.loadError = false;

      function loadRCs() {
        var query = {};
        if ($attrs.selectorRequired && _.isEmpty($scope.selector)) {
          $scope.rcs = [];
          return;
        }
        if ($scope.selector) {
          query.labelSelector = $scope.selector;
        }
        if ($scope.namespace) {
          query.ns = $scope.namespace;
        }
        k8s.replicationcontrollers.list(query)
          .then(function(rcs) {
            $scope.rcs = rcs;
            $scope.loadError = false;
          })
          .catch(function() {
            $scope.rcs = null;
            $scope.loadError = true;
          });
      }

      $scope.$watch('load', function(load) {
        if (load) {
          loadRCs();
        }
      });

      $scope.$on(k8s.events.RC_DELETED, function(e, data) {
        resourceMgrSvc.removeFromList($scope.rcs, data.resource);
      });

      $scope.$on(k8s.events.RC_ADDED, function(e, data) {
        resourceMgrSvc.updateInList($scope.rcs, data.resource);
      });

      $scope.$on(k8s.events.RC_MODIFIED, function(e, data) {
        resourceMgrSvc.updateInList($scope.rcs, data.resource);
      });

    }
  };

});
