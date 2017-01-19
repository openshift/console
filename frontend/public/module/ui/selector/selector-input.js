import {fromRequirements, toRequirements} from '../../k8s/selector';
import {fromString, toString} from '../../k8s/selector-requirement';

const toTags = selector => toRequirements(selector || {}).map(r => ({text: toString(r)}));

const fromTags = (tags, options) => {
  const requirements = (tags || []).map(tag => fromString(tag.text));
  return fromRequirements(requirements, options);
};

const looksLikeRequirement = (tag, options) => {
  const requirement = fromString(tag.text);
  return !!(requirement && (!_.get(options, 'basic') || requirement.operator === 'Equals')); // has to be boolean!
};

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
      controller: function coSelectorInputController($scope) {
        $scope.$watch('selector', function (selector) {
          $scope.tags = toTags(selector);
        }, /* objectEquality */true);

        $scope.$watch('tags', function (tags) {
          $scope.selector = fromTags(tags, $scope.options);
        }, /* objectEquality */true);

        $scope.onTagAdding = function onTagAdding(tag) {
          return looksLikeRequirement(tag, $scope.options);
        };
      }
    };
  })
;
