angular.module('bridge.page')
.controller('UsersCtrl', function($scope, dex, authSvc, ModalLauncherSvc) {
  'use strict';

  var latestLoad = 0;

  var loadUsers = function () {
    var batchSize = 100;
    var newUsers = [];
    var thisLoad, loadRemainingUsers;

    $scope.users = null;
    $scope.failed = false;
    $scope.loaded = false;

    latestLoad++;
    thisLoad = latestLoad;

    loadRemainingUsers = function(batch) {
      newUsers = newUsers.concat(batch.users);
      if (batch.nextPageToken) {
        return dex.users.list({
          maxResults: batchSize,
          nextPageToken: batch.nextPageToken
        }).then(loadRemainingUsers);
      } else {
        if (latestLoad === thisLoad) {
          $scope.users = newUsers;
        }
      }
    };

    dex.users.list({maxResults: batchSize})
    .then(loadRemainingUsers)
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

  loadUsers();
});
