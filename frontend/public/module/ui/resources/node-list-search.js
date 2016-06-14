/**
 * @fileoverview
 * List nodes in a table-like view.
 */

angular.module('bridge.ui')
.directive('coNodeListSearch', function(_, arraySvc, k8s, pkg, resourceMgrSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/node-list-search.html',
    restrict: 'E',
    replace: true,
    scope: {
      selector: '=',
    },
    controller: function($scope, $attrs) {
      $scope.loadError = false;

      function loadNodes() {
        var query = {};

        if ($attrs.selectorRequired && _.isEmpty($scope.selector)) {
          $scope.nodes = [];
          $scope.loadError = false;
          return;
        }

        if (!_.isEmpty($scope.selector)) {
          query.labelSelector = $scope.selector;
        }

        k8s.nodes.list(query)
          .then(function(nodes) {
            $scope.nodes = nodes;
            $scope.loadError = false;
          })
          .catch(function() {
            $scope.nodes = null;
            $scope.loadError = true;
          });
      }

      $scope.getPodFieldSelector = k8s.pods.fieldSelectors.node;

      loadNodes();

      $scope.getReadyStateLabel = k8s.nodes.getReadyStateLabel;

      const events = k8s.events.nodes;
      $scope.$on(events.DELETED, function(e, data) {
        resourceMgrSvc.removeFromList($scope.nodes, data.resource);
      });

      $scope.$on(events.ADDED, loadNodes);

      $scope.$on(events.MODIFIED, function(e, data) {
        resourceMgrSvc.updateInList($scope.nodes, data.resource);
      });

    }
  };

});
