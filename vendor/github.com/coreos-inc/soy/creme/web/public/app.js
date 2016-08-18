angular.module('lodash', []).factory('_', function($window) {
  'use strict';
  return $window._;
});

angular.module('underscore', []).factory('_', function($window) {
  'use strict';
  return $window._;
});

angular.module('jquery', []).factory('$', function($window) {
  'use strict';
  return $window.$;
});

angular.module('creme', [
  // angular deps
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'ngCookies',
  // other deps
  'lodash',
  'jquery',
  'mochi.ui.templates',
  'mochi.ui',
  'mochi.svc',
  // internal modules
  'creme.filter',
  'creme.svc',
  'creme.ui',
  'creme.ui.templates',
  'creme.page',
])
.config(function($provide, $windowProvider) {
  'use strict';
  var $window = $windowProvider.$get();
  if ($window.SERVER_FLAGS.sentryURL && Raven) {
    $provide.decorator('$exceptionHandler', function($delegate) {
      return function(ex, cause) {
        $delegate(ex, cause);
        Raven.captureException(ex, {extra: {cause: cause}});
      };
    });
  }
})
.config(function($routeProvider, $locationProvider, $httpProvider, $compileProvider, flagProvider) {
  'use strict';

  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
  flagProvider.setGlobalId('SERVER_FLAGS');
  $locationProvider.html5Mode(true);
  $httpProvider.interceptors.push('unauthorizedInterceptorSvc');

  $routeProvider
    .when('/', {
      controller: 'RedirectCtrl',
      template: '',
      title: 'Redirecting...',
    })
    .when('/signup/verify-email', {
      controller: 'SignupVerifyEmailCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/signup/verify-email.html',
      title: 'Verify Email',
    })
    .when('/overview', {
      name: 'base-overview',
      controller: 'OverviewCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/account/overview.html',
      title: 'Overview',
      resolve: {
        mustBeLoggedIn: mustBeLoggedIn,
      },
    })
    .when('/accounts/:accountID/overview', {
      name: 'overview-page',
      controller: 'OverviewCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/account/overview.html',
      title: 'Overview',
      resolve: {
        mustBeLoggedIn: mustBeLoggedIn,
      },
    })
    .when('/signup/summary', {
      controller: 'SignupSummaryCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/signup/summary.html',
      title: 'Product Summary',
      resolve: {
        mustInitSignup: mustInitSignup,
      },
    })
    .when('/signup/summary/:productName', {
      controller: 'SignupSummaryCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/signup/summary.html',
      title: 'Product Summary',
      resolve: {
        mustInitSignup: mustInitSignup,
      },
    })
    .when('/signup/summary/:productName/:planName', {
      controller: 'SignupSummaryCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/signup/summary.html',
      title: 'Product Summary',
      resolve: {
        mustInitSignup: mustInitSignup,
      },
    })
    .when('/signup/contact', {
      controller: 'SignupContactCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/signup/contact.html',
      title: 'Contact Information',
      resolve: {
        mustHaveNonEmptyCart: mustHaveNonEmptyCart,
      },
    })
    .when('/signup/billing', {
      controller: 'SignupBillingCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/signup/billing.html',
      title: 'Billing Information',
      resolve: {
        mustHaveNonEmptyCart: mustHaveNonEmptyCart,
      },
    })
    .when('/signup/confirm', {
      controller: 'SignupConfirmCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/signup/confirm.html',
      title: 'Confirm Purchase',
      resolve: {
        mustHaveNonEmptyCart: mustHaveNonEmptyCart,
      },
    })
    .when('/signup/order-complete', {
      controller: 'SignupOrderCompleteCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/signup/order-complete.html',
      title: 'Order Complete',
      resolve: {
        mustHaveAccount: mustHaveAccount,
      },
    })
    .when('/accounts/:accountID', {
      name: 'account-page',
      controller: 'AccountCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/account/account.html',
      title: 'Account',
      resolve: {
        mustHaveAccount: mustHaveAccount,
      },
    })
    .when('/accounts/:accountID/billing', {
      name: 'billing-page',
      controller: 'AccountBillingCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/billing/billing.html',
      title: 'Billing Information',
      resolve: {
        mustHaveAccount: mustHaveAccount,
      },
    })
    .when('/accounts/:accountID/purchases', {
      controller: 'PurchaseListCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/account/purchases.html',
      title: 'Purchases',
      resolve: {
        mustHaveAccount: mustHaveAccount,
      },
    })
    .when('/support', {
      controller: 'SupportCtrl',
      controllerAs: 'vm',
      templateUrl: '/static/page/support/support.html',
      title: 'Support',
      resolve: {
        mustHaveAccount: mustHaveAccount,
      },
    })
    .when('/error', {
      controller: 'GeneralErrorCtrl',
      controllerAs: 'errorCtrl',
      templateUrl: '/static/page/error/general-error.html',
      title: 'Error',
    })
    .otherwise({
      templateUrl: '/static/page/error/404.html',
      title: 'Page Not Found (404)'
    });

  function mustBeLoggedIn($q, authSvc) {
    var deferred = $q.defer();
    if (!authSvc.isLoggedIn()) {
      deferred.reject('no-auth-token');
      return deferred.promise;
    }

    if (!authSvc.emailVerified()) {
      deferred.reject('email-not-verified');
      return deferred.promise;
    }

    return authSvc.getCurrentUser();
  }

  function mustHaveAccount($q, authSvc, accountSvc) {
    return mustBeLoggedIn($q, authSvc)
    .then(function() {
      return accountSvc.list();
    })
    .then(function() {
      if (!accountSvc.hasAccount()) {
        return $q.reject('user-has-no-accounts');
      }
    });
  }

  function mustInitSignup($q, authSvc, signupSvc) {
    return mustBeLoggedIn($q, authSvc)
    .then(function() {
      return signupSvc.init();
    })
    .catch(function(err) {
      if (err === 'no-auth-token' || err === 'email-not-verified') {
        return $q.reject(err);
      }
      return $q.reject('signup-init-failure');
    });
  }

  function mustHaveNonEmptyCart($q, authSvc, cartSvc, signupSvc) {
    return mustInitSignup($q, authSvc, signupSvc)
    .then(function() {
      if (cartSvc.isEmpty()) {
        return $q.reject('cart-is-empty');
      }
    });
  }

})
.run(function($rootScope, $window, authSvc, routeProtectorSvc, localStorageSvc) {
  'use strict';
  routeProtectorSvc.start();
  $rootScope.$on('$routeChangeSuccess', function(event, current) {
    $window.scrollTo(0, 0);
    $rootScope.pageTitle = 'Tectonic';
    if (current && current.$$route && current.$$route.title) {
      $rootScope.pageTitle += ' ' + current.$$route.title;
    }
  });

  $rootScope.$on('userLogout', function(event) {
    localStorageSvc.clear();
  });

  $rootScope.canModifyAccount = authSvc.canModifyAccount;
});
