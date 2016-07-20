/**
 * @fileoverview
 * List RCs in a table-like view.
 */

angular.module('bridge.ui')
.directive('coReplicationControllerList', function(k8s) {
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
    controller: function($scope, Firehose) {
      $scope.rcs = null;
      $scope.loadError = false;

      new Firehose(k8s.replicationcontrollers, $scope.namespace, $scope.selector)
        .watchList()
        .bindScope($scope, 'rcs');
    }
  };
});
