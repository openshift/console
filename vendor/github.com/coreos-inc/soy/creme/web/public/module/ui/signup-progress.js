angular.module('creme.ui').directive('tecSignupProgress', function(signupSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/signup-progress.html',
    transclude: false,
    restrict: 'E',
    replace: true,
    scope: {
      activeIndex: '=',
    },
    controller: function($scope) {
      $scope.hideContact = $scope.hideBilling = function() {
        return signupSvc.isAccountComplete();
      };
    },
  };

});
