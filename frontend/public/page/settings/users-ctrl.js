angular.module('bridge.page')
.controller('UsersCtrl', function($scope, dex, ModalLauncherSvc) {
  'use strict';

  var loadUsers = function () {
    $scope.users = null;
    $scope.failed = false;
    $scope.loaded = false;

    dex.users.list()
    .then(function(l) {
      console.log(l);
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

  loadUsers();
});
