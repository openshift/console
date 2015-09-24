angular.module('bridge.service')
.factory('authSvc', function($cookies, $log, $window, $location, $http, errorSvc, featuresSvc, pkg) {
  'use strict';

  function loginState() {
    var state = $cookies.state;
    if (!state) {
      return null;
    }
    return JSON.parse(state);
  }

  function email() {
    var s = loginState();
    if (s) {
      return s.email;
    }
  }

  return {
    state: loginState,
    email: email,

    logout: function(prev) {
      var url = '/auth/login';
      return $http.post('/auth/logout')
        .then(function() {
          if (prev) {
            url += '?prev=' + prev;
          }
          $window.location.href = url;
        })
        .catch(function() {
          errorSvc.sendToErrorPage('auth', 'logout_error');
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
      return pkg.md5(em);
    },

  };

})

.factory('ensureLoggedInSvc', function($q, authSvc, featuresSvc) {
  'use strict';
  var deferred = $q.defer();

  if (featuresSvc.isAuthDisabled) {
    deferred.resolve();
    return deferred.promise;
  }

  if (authSvc.isLoggedIn()) {
    deferred.resolve();
  } else {
    deferred.reject('not-logged-in');
  }
  return deferred.promise;
});
