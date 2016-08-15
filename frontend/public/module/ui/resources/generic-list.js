angular.module('bridge.ui')
.directive('coGenericK8sList', function () {
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
      name: '=component',
    },
    controller: function($scope) {
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
