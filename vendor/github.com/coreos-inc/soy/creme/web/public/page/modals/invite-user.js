angular.module('creme.page').controller('InviteUserModalCtrl', InviteUserModalCtrl);

function InviteUserModalCtrl($modalInstance, $q, accountSvc, messageSvc, accountID) {
  'use strict';
  this.errorMessage = null;
  this.defaultErrorMessage = messageSvc.get('user', 'invite_error');
  this.user = {
    email: '',
    role: 0,
  };

  this.submit = function(form) {
    var that = this;
    if (form.$invalid) {
      return;
    }

    this.errorMessage = null;
    this.submitPromise = accountSvc.inviteUser(accountID, this.user);
    this.submitPromise
    .then(function(result) {
      that.errorMessage = null;
      $modalInstance.close(result);
    })
    .catch(function(e) {
      if (e.data && e.data.description) {
        that.errorMessage = e.data.description;
      } else {
        that.errorMessage = that.defaultErrorMessage;
      }
      return $q.reject(that.errorMessage);
    });

  };

}
