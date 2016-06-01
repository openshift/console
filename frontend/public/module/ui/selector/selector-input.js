angular.module('bridge.ui')
  .directive('coSelectorInput', function coSelectorInput() {
    'use strict';

    return {
      templateUrl: '/static/module/ui/selector/selector-input.html',
      restrict: 'E',
      replace: true,
      scope: {
        selector: '=ngModel',
        options: '='
      },
      controller: function coSelectorInputController(
        $scope,
        coSelectorInputSservice
      ) {
        $scope.$watch('selector', function (selector) {
          $scope.tags = coSelectorInputSservice.toTags(selector);
        }, /* objectEquality */true);

        $scope.$watch('tags', function (tags) {
          $scope.selector = coSelectorInputSservice.fromTags(tags, $scope.options);
        }, /* objectEquality */true);

        $scope.onTagAdding = function onTagAdding(tag) {
          return coSelectorInputSservice.looksLikeRequirement(tag, $scope.options);
        };
      }
    };
  })
;
