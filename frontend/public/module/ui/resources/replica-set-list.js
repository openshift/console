/**
 * @fileoverview
 * List replica sets in a table-like view.
 */

angular.module('bridge.ui')
.directive('coReplicaSetList', function(k8s) {
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
    controller: function($scope, Firehose) {
      new Firehose(k8s.replicasets, $scope.namespace, $scope.selector)
        .watchList()
        .bindScope($scope, 'rss');
    },
  }
});
