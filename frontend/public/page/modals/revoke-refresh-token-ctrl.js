angular.module('bridge.page')
.controller('RevokeRefreshTokenCtrl', function($scope, dex, user) {
  'use strict';

  $scope.user = user;

  $scope.action = 'Revoke Refresh Token';
  $scope.cancel = `Keep ${$scope.user.displayName || 'Tectonic User'}'s Token`;

  $scope.revokeRefreshToken = function(user) {
    $scope.refreshTokenRevoked = dex.users.revokeRefreshToken(user.id);
    $scope.refreshTokenRevoked.then($scope.$close);
  };
});
