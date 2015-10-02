angular.module('bridge.page')
.controller('UsersCtrl', function($scope, dex, authSvc, ModalLauncherSvc, CONST) {
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
    instance.result.then(loadUsers);
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

  $scope.dateFmt = CONST.dateFmt;

  loadUsers();
});
