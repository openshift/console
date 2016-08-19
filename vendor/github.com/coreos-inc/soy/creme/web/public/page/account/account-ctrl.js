angular.module('creme.page').controller('AccountCtrl', AccountCtrl);

function AccountCtrl($routeParams, $rootScope, _, $q, accountSvc, messageSvc, authSvc, modalLauncherSvc) {
  'use strict';
  var that = this;
  this.loadState = {
    account: {
      failed: false,
      loaded: false,
    },
    users: {
      failed: false,
      loaded: false,
    },
  };
  this.users = null;
  this.account = null;
  this.currentUserEmail = authSvc.email();

  this.isAddressEmpty = accountSvc.isAddressEmpty;

  this.loadUsers = function() {
    that.loadState.users.loaded = false;

    return accountSvc.listUsers($routeParams.accountID)
    .then(function(users) {
      that.users = users;
      that.loadState.users.failed = false;
    })
    .catch(function(e) {
      that.loadState.users.failed = true;
    })
    .finally(function(e) {
      that.loadState.users.loaded = true;
    });
  };

  this.loadAccount = function() {
    that.loadState.account.loaded = false;

    return accountSvc.get($routeParams.accountID)
    .then(function(a) {
      that.account = a;
      that.mailingAddress = accountSvc.mailingAddress(a);
      that.billingAddress = accountSvc.billingAddress(a);
      that.loadState.account.failed = false;
    })
    .catch(function(e) {
      that.loadState.account.failed = true;
    })
    .finally(function(e) {
      that.loadState.account.loaded = true;
    });
  };

  this.openProfileModal = function() {
    modalLauncherSvc.open('update-profile', {
      model: this.account,
      submitFn: _.wrap(accountSvc.update),
      defaultErrorMessage: messageSvc.get('contact', 'update_error'),
    }).result
    .then(this.loadAccount);
  };

  this.openTerminateModal = function(account) {
    modalLauncherSvc.open('terminate-account', {
      model: account.id,
      submitFn: _.wrap(accountSvc.terminate),
      defaultErrorMessage: messageSvc.get('account', 'update_error'),
    }).result
    .then(function() {
      authSvc.logout();
    });
  };

  this.openMailingAddressModal = function() {
    modalLauncherSvc.open('update-mailing-address', {
      model: this.mailingAddress,
      submitFn: _.wrap(function(a) {
        return accountSvc.upsertAddress(that.account.id, a);
      }),
      defaultErrorMessage: messageSvc.get('account', 'update_error'),
    }).result
    .then(this.loadAccount);
  };

  this.openInviteUserModal = function() {
    modalLauncherSvc.open('invite-user', {
      accountID: this.account.id,
    })
    .result
    .then(this.loadUsers);
  };

  this.openUpdateUserModal = function(u) {
    modalLauncherSvc.open('update-user', {
      model: u,
      submitFn: _.wrap(_.bind(accountSvc.changeUserRole, null, that.account.id)),
      defaultErrorMessage: messageSvc.get('user', 'update_error'),
    }).result
    .then(this.loadUsers);
  };

  this.openRevokeUserModal = function(u) {
    var revokefn;
    if (u.dexID !== '') {
      revokefn = accountSvc.revokeAccountUser;
    } else {
      revokefn = accountSvc.revokeInvitedUser;
    }
    modalLauncherSvc.open('revoke-user', {
      model: u,
      submitFn: _.wrap(_.bind(revokefn, null, that.account.id)),
      defaultErrorMessage: messageSvc.get('user', 'update_error'),
    }).result
    .then(this.loadUsers);
  };

  this.showUserCog = function(u) {
    if (!that.account) {
      return false;
    }
    if (!$rootScope.canModifyAccount(that.account.id)) {
      return false;
    }
    if (u.email === this.currentUserEmail) {
      return false;
    }
    if (u.dexID === '' && u.email === '') {
      return false;
    }
    return true;
  };

  this.loadAccount();
  this.loadUsers();
}
