angular.module('bridge.page')
.controller('UsersCtrl', function($scope, _, dex, authSvc, ModalLauncherSvc) {
  'use strict';
  var latestLoad = 0;
  var loadUsers = function () {
    var tooManyUsers = 1000;
    var batchSize = 100;
    var newUsers = [];
    var thisLoad, loadRemainingUsers;
    var authState = authSvc.state();

    $scope.yourId = authState ? authState.userID : null;
    $scope.users = null;
    $scope.userGroups = null;
    $scope.failed = false;

    latestLoad++;
    thisLoad = latestLoad;

    loadRemainingUsers = function(batch) {
      newUsers = newUsers.concat(batch.users);
      if (batch.nextPageToken && newUsers.length < tooManyUsers) {
        return dex.users.list({
          maxResults: batchSize,
          nextPageToken: batch.nextPageToken
        }).then(loadRemainingUsers);
      } else if (latestLoad === thisLoad) {
        $scope.userGroups = _.groupBy(newUsers, function(u) {
          return u.disabled ? 'disabled' : 'active';
        });
        $scope.users = newUsers;
      }
    };

    dex.users.list({maxResults: batchSize})
    .then(loadRemainingUsers)
    .catch(function(reason) {
      if (reason && reason.data && reason.data.error_description) {
        $scope.loadErrorMessage = reason.data.error_description;
      } else {
        $scope.loadErrorMessage = null;
      }
      $scope.failed = true;
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

  loadUsers();
});
