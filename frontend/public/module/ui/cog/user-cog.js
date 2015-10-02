/**
 * @fileoverview
 * Cog menu directive for users.
 */

angular.module('bridge.ui')
.directive('coUserCog', function() {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      user: '=',
      onselect: '&',
    },
    controller: function($scope) {
      var desiredState = !$scope.user.disabled;
      var label = desiredState ? 'Disable User' : 'Enable User';
      $scope.cogOptions = [{
        label: label,
        weight: 100,
        callback: function() {
          $scope.onselect()($scope.user, desiredState);
        }
      }];
    },
  };
});
