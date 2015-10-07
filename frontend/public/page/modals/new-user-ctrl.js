angular.module('bridge.page')
.controller('NewUserCtrl', function($scope, $window, dex) {
  'use strict';

  $scope.model = {
    displayName: null,
    email: null,
    admin: true,
  };

  $scope.createUser = function() {
    $scope.userCreated = dex.users.create({
      user: {
        email: $scope.model.email,
        displayName: $scope.model.displayName,
        admin: $scope.admin,
      },
      redirectURL: $window.SERVER_FLAGS.newUserAuthCallbackURL
    });
    $scope.userCreated.then($scope.$close);
  };
});
