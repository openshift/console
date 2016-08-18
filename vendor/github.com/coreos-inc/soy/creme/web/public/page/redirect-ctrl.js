angular.module('creme.svc').controller('RedirectCtrl', RedirectCtrl);
function RedirectCtrl(_, $location, $rootScope, authSvc, errorSvc, accountSvc, routeHrefSvc) {
  'use strict';
  var q = $location.search();
  var landingPath = '/overview';

  if (q.error) {
    errorSvc.sendToErrorPage(q.error_type, q.error);
    return;
  }

  if (!authSvc.isLoggedIn()) {
    authSvc.loginRedirect();
    return;
  }

  if (!authSvc.emailVerified()) {
    authSvc.emailNotVerifiedRedirect();
    return;
  }

  function redirect() {
    var currentID = accountSvc.currentID();
    if (currentID) {
      landingPath = routeHrefSvc.expand('overview-page', {
        accountID: currentID
      });
    }
    $location.replace();
    $location.path(landingPath);
  }

  if (accountSvc.currentID()) {
    redirect();
    return;
  }

  accountSvc.list()
    .then(function(accts) {
      redirect();
    })
    .catch(function(e) {
      $rootScope.$emit('page-load-error', e);
    });
}

angular.module('creme.svc')
.factory('routeProtectorSvc', function($rootScope, $location, $window, $log, authSvc, signupSvc, errorSvc) {
  'use strict';
  return {
    start: function() {
      $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
        $log.error('route change error: ' + rejection);

        if (rejection.status === 401) {
          // let the xhr-unauthorized handler deal with these.
          return;
        }

        if (rejection.status === 503) {
          errorSvc.sendToErrorPage('system', 'unavailable');
          return;
        }

        switch(rejection) {
          case 'signup-init-failure':
            errorSvc.sendToErrorPage('account', 'load_error');
            break;
          case 'no-auth-token':
            authSvc.loginRedirect();
            break;
          case 'email-not-verified':
            authSvc.emailNotVerifiedRedirect();
            break;
          case 'signup-already-complete':
          case 'user-has-no-accounts':
          case 'cart-is-empty':
            $window.location.href = '/';
            break;
          default:
            $window.location.href = '/';
        }
      });

      $rootScope.$on('xhr-error-unauthorized', function(e, rejection) {
        if (rejection && rejection.status === 401) {
          authSvc.loginRedirect();
        }
      });

    },
  };
});
