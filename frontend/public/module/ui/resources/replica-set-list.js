/**
 * @fileoverview
 * List replica sets in a table-like view.
 */

angular.module('bridge.ui')
.directive('coReplicaSetList', function(k8s, _, arraySvc, resourceMgrSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/replica-set-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      namespace: '=',
      search: '=',
      selector: '=',
      load: '=',
    },
    controller: function($scope, $attrs) {
      $scope.rss = null;
      $scope.loadError = false;

      function loadRSs() {
        var query = {};
        if (!$scope.load) {
          return;
        }

        if ($attrs.selectorRequired && _.isEmpty($scope.selector)) {
          $scope.rss = [];
          return;
        }

        if (!_.isEmpty($scope.selector)) {
          query.labelSelector = $scope.selector;
        }

        if ($scope.namespace) {
          query.ns = $scope.namespace;
        }

        k8s.replicasets.list(query)
          .then(function(rss) {
            $scope.rss = rss;
            $scope.loadError = false;
          })
          .catch(function() {
            $scope.rss = null;
            $scope.loadError = true;
          });
      }

      $scope.$watch('load', loadRSs);

      const events = k8s.events.replicaset;
      $scope.$on(events.DELETED, function(e, data) {
        resourceMgrSvc.removeFromList($scope.rss, data.resource);
      });

      $scope.$on(events.ADDED, loadRSs);

      $scope.$on(events.MODIFIED, function(e, data) {
        resourceMgrSvc.updateInList($scope.rss, data.resource);
      });
    }
  };
});
