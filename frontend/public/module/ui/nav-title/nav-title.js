angular.module('bridge.ui')
.directive('tecNavTitle', function() {
  'use strict';

  return {
    template: '<react-component name="NavTitle" props="props"></react-component>',
    transclude: true,
    restrict: 'E',
    replace: true,
    scope: {
      title: '@',
      kind: '=',
      detail: '=',
    },
    controller: function ($scope) {
      $scope.props = _.pick($scope, ['detail', 'kind']);
      $scope.$watch('title', title => $scope.props.title = title);
    },
  };
});
