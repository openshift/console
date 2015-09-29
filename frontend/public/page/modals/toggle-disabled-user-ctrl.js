angular.module('bridge.page')
.controller('ToggleDisabledUserCtrl', function($scope, dex, user, disableIfTrue) {
  'use strict';

  $scope.disableIfTrue = disableIfTrue;
  $scope.user = user;

  $scope.toggleDisabled = function(toggledUser, desiredState) {
    $scope.disabledToggled = dex.users.disable(toggledUser.id, desiredState)
    .then(function() {
      $scope.$close();
    });
  };
});
