angular.module('bridge.page')
.controller('NewUserCtrl', function($scope, $window, dex) {
  'use strict';

  $scope.model = {
    displayName: null,
    email: null,
    admin: true,
  };

  $scope.createUser = function(form) {
    if (form.$valid) {
      $scope.userCreated = dex.users.create({
        user: {
          email: $scope.model.email,
          displayName: $scope.model.displayName,
          admin: $scope.model.admin,
        },
        redirectURL: $window.SERVER_FLAGS.loginSuccessURL
      });
      $scope.userCreated.then($scope.$close);
    }
  };
});
