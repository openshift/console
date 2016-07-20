/**
 * @fileoverview
 * List nodes in a table-like view.
 */

angular.module('bridge.ui')
.directive('coNodeListSearch', function(_, k8s) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/node-list-search.html',
    restrict: 'E',
    replace: true,
    scope: {
      selector: '=',
    },
    controller: function($scope, Firehose) {
      $scope.getPodFieldSelector = k8s.pods.fieldSelectors.node;
      $scope.getReadyStateLabel = k8s.nodes.getReadyStateLabel;
      new Firehose(k8s.nodes, null, $scope.selector)
        .watchList()
        .bindScope($scope);
    }
  };
});
