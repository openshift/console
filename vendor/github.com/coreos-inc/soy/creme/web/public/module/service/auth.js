angular.module('creme.svc')
.factory('authSvc', function($q, $cookies, $log, $window, $location, $http, $rootScope, flag, apiSvc,
      errorSvc, USER_ROLE) {
  'use strict';

  var svc, currentUser;

  svc = {
    state: loginState,
    emailVerified: emailVerified,
    resendVerification: resendVerification,
    email: getEmail,
    userID: getUserID,
    logout: logout,
    isLoggedIn: isLoggedIn,
    loginRedirect: loginRedirect,
    emailNotVerifiedRedirect: emailNotVerifiedRedirect,
    getCurrentUser: getCurrentUser,
    canModifyAccount: canModifyAccount,
  };

  // determines if the current user had modify access on the provided account id.
  function canModifyAccount(accountID) {
    var acctRole;
    if (!currentUser) {
      return false;
    }

    acctRole = _.findWhere(currentUser.accountRoles, { accountID: accountID });
    return acctRole && acctRole.role && acctRole.role.value === USER_ROLE.ADMIN;
  }

  function getCurrentUser() {
    return apiSvc.getUser(getUserID())
    .then(function(resp) {
      if (!_.isEmpty(resp) && !_.isEmpty(resp.user)) {
        currentUser = resp.user;
      }
      return currentUser;
    });
  }

  function emailNotVerifiedRedirect() {
    $location.replace();
    $location.path('/signup/verify-email');
  }

  // Infer user is logged-in by presence of valid state cookie.
  function isLoggedIn() {
    var state = loginState();
    return !!state;
  }

  function logout() {
    $rootScope.$emit('userLogout');

    return $http.post(flag.get('logoutURL'))
    .then(function() {
      loginRedirect('/');
    })
    .catch(function() {
      errorSvc.sendToErrorPage('auth', 'logout_error');
    });
  }

  function getUserID() {
    var s = loginState();
    if (s) {
      return s.userID;
    }
  }

  function getEmail() {
    var s = loginState();
    if (s) {
      return s.email;
    }
  }

  function resendVerification() {
    var url = '/api/v1/users/resend-verification';
    return $http.post(url);
  }

  function emailVerified() {
    var s = loginState();
    if (s) {
      return s.emailVerified;
    }
  }

  function loginState() {
    var state = $cookies.get('state');
    if (!state) {
      return null;
    }
    return JSON.parse(state);
  }

  function loginRedirect(next) {
    var url = flag.get('loginURL');
    var path = $location.path();
    url += '?next=' + (next || path || '');
    $window.location.href = url;
  }

  return svc;

});
