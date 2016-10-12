/**
 * @fileoverview
 * Dynamically lists resources in a table-like view.
 */

angular.module('bridge.ui')
.directive('coResourceList', function() {
  'use strict';

  return {
    template: '<react-component name="ResourceList" props="props" />',
    restrict: 'E',
    replace: true,
    scope: {
      kind: '=',
      namespace: '=',
      selector: '=',
    },
    controller: function($scope) {
      $scope.props = {
        kind: $scope.kind,
        namespace: $scope.namespace,
        selector: $scope.selector,
      };
    }
  };
});
