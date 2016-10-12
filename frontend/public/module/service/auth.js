import Cookies from 'js-cookie';

angular.module('bridge.service')
.factory('authSvc', function($log, $window, $location, $http) {
  'use strict';

  function loginState() {
    var state = Cookies.get('state');
    if (!state) {
      return null;
    }

    try {
      return JSON.parse($window.atob(state));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error.stack);
      return null;
    }
  }

  function loginStateItem(key) {
    return (loginState() || {})[key];
  }

  function userID() {
    return loginStateItem('userID');
  }

  function name() {
    return loginStateItem('name');
  }

  function email() {
    return loginStateItem('email');
  }

  return {
    state: loginState,
    userID: userID,
    name: name,
    email: email,

    logout: function(prev) {
      var url = SERVER_FLAGS.loginURL;
      return $http.post(SERVER_FLAGS.logoutURL)
        .then(function() {
          if (prev) {
            url += '?prev=' + prev;
          }
          $window.location.href = url;
        })
        .catch(function() {
          $window.location.href = `${SERVER_FLAGS.loginErrorURL}?error_type=auth&error=logout_error`;
        });
    },

    // Infer user is logged-in by presence of valid state cookie.
    isLoggedIn: function() {
      var state = loginState();
      return !!state;
    },

    emailHash: function() {
      var em = email();
      if (!em) {
        return;
      }
      return $window.md5(em);
    },

  };

})

.factory('ensureLoggedInSvc', function($rootScope, $q, authSvc, featuresSvc) {
  'use strict';

  return $q.resolve().then(function () {
    if (featuresSvc.isAuthDisabled) {
      return;
    }

    if (!authSvc.isLoggedIn()) {
      return $q.reject('not-logged-in');
    }

    $rootScope.user = {
      id: authSvc.userID(),
      name: authSvc.name(),
      email: authSvc.email(),
    };
  });
});
