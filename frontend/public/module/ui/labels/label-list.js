angular.module('bridge.ui')

.directive('coLabelList', function() {
  'use strict';
  return {
    templateUrl: '/static/module/ui/labels/label-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      // kind id
      kind: '@',
      expand: '@',
      labels: '='
    },
    controller: function($scope) {
      $scope.isEmpty = function() {
        return !$scope.labels || angular.equals({}, $scope.labels);
      }
    }
  };
});
