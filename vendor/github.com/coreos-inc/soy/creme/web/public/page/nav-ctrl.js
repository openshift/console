angular.module('creme.page').controller('NavCtrl', NavCtrl);

function NavCtrl($location, $route, $scope, $rootScope, accountSvc, signupSvc, authSvc, routeHrefSvc) {
  'use strict';
  var that = this;
  this.accounts = null;
  this.isEmailVerified = authSvc.emailVerified;
  this.readonly = false;
  this.account = null;
  $rootScope.$on('current-account-changed', function(e, acct) {
    that.account = acct;
  });

  $rootScope.$on('new-account-created', function() {
    accountSvc.list()
    .then(function(accts) {
      that.accounts = accts;
    });
  });

  this.hasAccount = function() {
    return accountSvc.hasAccount();
  };

  this.navigate = function(routeName) {
    var path;
    var accountID = accountSvc.currentID();
    if (accountID && routeName) {
      path = routeHrefSvc.expand(routeName, {
        accountID: accountID,
      });
    } else {
      path = '/';
    }
    $location.path(path);
  };

  this.switchAccount = function(a) {
    var routeName = $route.current.$$route.name;
    accountSvc.setCurrent(a);
    if (routeName) {
      this.navigate(routeName);
      return;
    }
    // Send back to overview page if switching acounts mid-signup.
    if ($route.current.$$route.originalPath.indexOf('/signup') >= 0) {
      this.navigate(null);
    }
  };

  if (authSvc.isLoggedIn() && authSvc.emailVerified()) {
    accountSvc.list()
    .then(function(accts) {
      that.accounts = accts;
    });

    authSvc.getCurrentUser()
    .then(function(u) {
      that.currentUser = u;
    });
  }

  $scope.$watch(function() {
    if (!that.account || !that.currentUser) {
      return '';
    }
    return that.account.id + '||' + that.currentUser.dexID;
  },
  function(val) {
    if (val) {
      that.readonly = !authSvc.canModifyAccount(that.account.id);
    }
  });
}
