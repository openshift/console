/**
 * @fileoverview
 * List deployments in a table-like view.
 */

angular.module('bridge.ui')
.directive('coDeploymentList', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/deployment-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      namespace: '=',
      search: '=',
      selector: '=',
      load: '=',
    },
    controller: function($scope, k8s, Firehose) {
      new Firehose(k8s.deployments, $scope.namespace, $scope.selector)
        .watchList()
        .bindScope($scope);
    }
  };
});
