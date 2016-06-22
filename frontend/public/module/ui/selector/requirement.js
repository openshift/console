angular.module('bridge.ui')
  .directive('coRequirement', function coRequirement() {
    'use strict';

    return {
      templateUrl: '/static/module/ui/selector/requirement.html',
      restrict: 'E',
      replace: true,
      scope: {
        requirement: '=',
        withIcon: '='
      },
      controller: function coRequirementController(
        $scope,
        k8s
      ) {
        $scope.$watch('requirement', function (requirement) {
          $scope.requirementAsString           = k8s.selectorRequirement.toString(requirement);
          $scope.requirementAsUrlEncodedString = encodeURIComponent($scope.requirementAsString);
        });
      }
    };
  })
;
