angular.module('bridge.ui')
.directive('coSparklineGraph', function () {
  'use strict';
  return {
    template: '<react-component name="sparklinegraph" props="props" />',
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
