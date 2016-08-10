/**
 * @fileoverview
 * List out pods in a table-like view.
 */

angular.module('bridge.ui')
.directive('coPodList', function () {
  'use strict';
  return {
    template: '<react-component name="{{name}}" props="props" />',
    restrict: 'E',
    replace: true,
    scope: {
      // (optional) namespace to load pods from
      namespace: '=',
      // label selector to filter by. optional unless selector-required=true
      selector: '=',
      // optional search filter
      search: '=',
      // field filters to apply to pod list
      filter: '=',
      // force error
      error: '=',
      // filter pod list by an api field selector
      fieldSelector: '=',
    },
    controller: function($scope) {
      $scope.name = 'podsList';
      $scope.props = {
        namespace: $scope.namespace,
        selector: $scope.selector,
        search: $scope.search,
        filter: $scope.filter,
        error: $scope.error,
        fieldSelector: $scope.fieldSelector
      };
    }
  };
});
