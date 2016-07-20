
/**
 * @fileoverview
 * List out pods in a table-like view.
 */

angular.module('bridge.ui')
.directive('coPodList', function (k8s) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/pod-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      // (optional) namespace to load pods from
      namespace: '=',
      // label selector to filter by. optional unless selector-required=true
      selector: '=',
      // optional search filter
      searchFilter: '=search',
      // field filters to apply to pod list
      podsFilterQuery: '=filter',
      // force error
      error: '=',
      // filter pod list by an api field selector
      fieldSelector: '=',
    },
    controller: function($scope, Firehose) {
      if ($scope.error) {
        $scope.loadError = $scope.error;
        return;
      }

      new Firehose(k8s.pods, $scope.namespace, $scope.selector, $scope.fieldSelector)
        .watchList()
        .bindScope($scope);
    }
  };
});
