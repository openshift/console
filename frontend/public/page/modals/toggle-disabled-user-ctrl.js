angular.module('bridge.page')
.controller('ToggleDisabledUserCtrl', function($scope, dex, user, disableIfTrue) {
  'use strict';

  $scope.disableIfTrue = disableIfTrue;
  $scope.user = user;

  $scope.action = disableIfTrue ? 'Disable User' : 'Enable User';
  $scope.cancel = disableIfTrue ? 'Keep User Enabled' : 'Keep User Disabled';
  $scope.blurb = disableIfTrue ?
    'Once the user is disabled they will not be able to access Tectonic.' :
    'Once the user is enabled they will be able to access Tectonic.';

  $scope.toggleDisabled = function(toggledUser, desiredState) {
    $scope.disabledToggled =
      dex.users.disable(toggledUser.id, desiredState).then($scope.$close);
  };
});
