angular.module('bridge.ui')
.directive('coSparklineWidget', function () {
  'use strict';
  return {
    template: '<react-component name="sparklinewidget" props="props" />',
    restrict: 'E',
    replace: true,
    scope: {
      heading: '=',
      query: '=',
      limit: '=',
      units: '='
    },
    controller: function($scope) {
      $scope.props = {
        heading: $scope.heading,
        query: $scope.query,
        limit: $scope.limit,
        units: $scope.units
      };
    }
  };
});
