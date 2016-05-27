angular.module('bridge.ui')
  .directive('coSelector', function coSelector() {
    'use strict';

    return {
      templateUrl: '/static/module/ui/selector/selector.html',
      restrict: 'E',
      replace: true,
      scope: {
        expand: '=',
        selector: '='
      },
      controller: function coSelectorController($scope, k8s) {
        $scope.$watch('selector', function (selector) {
          $scope.requirements = k8s.selector.toRequirements(selector || {});
        });
      }
    };
  })
;
