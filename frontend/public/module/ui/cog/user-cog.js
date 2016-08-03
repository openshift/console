/**
 * @fileoverview
 * Cog menu directive for users.
 */

angular.module('bridge.ui')
.directive('coUserCog', function(featuresSvc, dex, ModalLauncherSvc) {
  'use strict';

  return {
    template: '<div class="co-m-cog-wrapper"><co-cog ng-if="cogOptions.length" options="cogOptions" size="small" anchor="left"></co-cog></div>',
    restrict: 'E',
    replace: true,
    scope: {
      user: '=',
      onselect: '&',
      reload: '&',
      yourID: '=yourId'
    },
    controller: function($scope) {
      $scope.cogOptions = [];
      
      if (featuresSvc.revokeToken) {
        $scope.cogOptions.push({
          label: 'Revoke Refresh Token',
          weight: 50,
          callback: function() {
            ModalLauncherSvc.open('revoke-refresh-token', {
              user: $scope.user
            });
          }
        });
      }

      if ($scope.yourID !== $scope.user.id) {
        $scope.cogOptions.push({
          label: $scope.user.disabled ? 'Enable User' : 'Disable User',
          weight: 100,
          callback: function() {
            var instance = ModalLauncherSvc.open('toggle-disabled-user', {
              user: $scope.user,
              disableIfTrue: !$scope.user.disabled
            });
            instance.result.then($scope.reload()());
          }
        });
      }
    },
  };
});
