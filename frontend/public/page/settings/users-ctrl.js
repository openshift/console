angular.module('bridge.page')
.controller('UsersCtrl', function($scope, dex, authSvc, ModalLauncherSvc) {
  'use strict';

  var loadUsers = function () {
    $scope.users = null;
    $scope.failed = false;
    $scope.loaded = false;

    dex.users.list()
    .then(function(l) {
      $scope.users = l.users;
    })
    .catch(function() {
      $scope.failed = true;
    })
    .finally(function() {
      $scope.loaded = true;
    });
  };

  $scope.newUserModal = function() {
    var instance = ModalLauncherSvc.open('new-user', {});
    instance.result
    .then(function(results) {
      if (results.resetPasswordLink) {
        ModalLauncherSvc.open('new-user-invite-link', {
          link: results.resetPasswordLink
        });
      }
    })
    .then(loadUsers);
  };

  $scope.showDisableModal = function(user, disableIfTrue) {
    var instance = ModalLauncherSvc.open('toggle-disabled-user', {
      user: user,
      disableIfTrue: disableIfTrue
    });
    instance.result.then(loadUsers);
  };

  $scope.isYou = function(user) {
    var s = authSvc.state();
    return s && (user.id === s.userID);
  };

  loadUsers();
});
