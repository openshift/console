angular.module('creme.page')
.factory('modalLauncherSvc', function($modal) {
  'use strict';

  var modalConfig = {
    'cancel-subscription': {
      templateUrl: '/static/page/modals/cancel-subscription.html',
      controller: 'CancelSubscriptionModalCtrl',
      controllerAs: 'vm',
    },
    'uncancel-subscription': {
      templateUrl: '/static/page/modals/uncancel-subscription.html',
      controller: 'InfoUpdateModalCtrl',
      controllerAs: 'vm',
    },
    'agree-to-tos': {
      templateUrl: '/static/page/modals/agree-to-tos.html',
      controller: 'AgreeToTOSCtrl',
      controllerAs: 'vm',
    },
    'create-credit-card': {
      templateUrl: '/static/page/modals/credit-card.html',
      controller: 'CreditCardModalCtrl',
      controllerAs: 'vm',
    },
    'update-mailing-address': {
      templateUrl: '/static/page/modals/mailing-address.html',
      controller: 'InfoUpdateModalCtrl',
      controllerAs: 'vm',
    },
    'update-profile': {
      templateUrl: '/static/page/modals/profile.html',
      controller: 'InfoUpdateModalCtrl',
      controllerAs: 'vm',
    },
    'update-billing-address': {
      templateUrl: '/static/page/modals/billing-address.html',
      controller: 'InfoUpdateModalCtrl',
      controllerAs: 'vm',
    },
    'update-payment-method': {
      templateUrl: '/static/page/modals/payment-method.html',
      controller: 'PaymentMethodModalCtrl',
      controllerAs: 'vm',
    },
    'terminate-account': {
      templateUrl: '/static/page/modals/terminate-account.html',
      controller: 'InfoUpdateModalCtrl',
      controllerAs: 'vm',
    },
    'invite-user': {
      templateUrl: '/static/page/modals/invite-user.html',
      controller: 'InviteUserModalCtrl',
      controllerAs: 'vm',
    },
    'update-user': {
      templateUrl: '/static/page/modals/update-user.html',
      controller: 'InfoUpdateModalCtrl',
      controllerAs: 'vm',
    },
    'revoke-user': {
      templateUrl: '/static/page/modals/revoke-user.html',
      controller: 'InfoUpdateModalCtrl',
      controllerAs: 'vm',
    },
    'account-selector': {
      templateUrl: '/static/page/modals/account-selector.html',
      controller: 'AccountSelectorModalCtrl',
      controllerAs: 'vm',
    },
  };

  return {
    open: open,
  };

  function open(name, resolve) {
    var config = modalConfig[name];
    angular.forEach(resolve, function(value, key) {
      // Wrap value types in a function b/c modal expectes a function.
      if (!angular.isFunction(value)) {
        resolve[key] = function() {
          return value;
        };
      }
    });
    config.resolve = resolve;
    return $modal.open(config);
  }

});
