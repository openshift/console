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
      limitText: '=',
      units: '='
    },
    controller: function($scope) {
      const update = () => {
        const props = {
          heading: $scope.heading,
          query: $scope.query,
          limit: $scope.limit,
          units: $scope.units
        };
        if ($scope.limitText) {
          props.limitText = $scope.limitText;
        }
        $scope.props = props;
      };

      update();
      $scope.$watch('query', update);
      $scope.$watch('limit', update);
    }
  };
});
