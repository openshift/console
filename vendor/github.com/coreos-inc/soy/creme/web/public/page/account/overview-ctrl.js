angular.module('creme.page').controller('OverviewCtrl', OverviewCtrl);

function OverviewCtrl(_, $q, $routeParams, $rootScope, accountSvc, messageSvc, productSvc, modalLauncherSvc) {
  'use strict';

  var that = this;
  var givenAccountID = $routeParams.accountID || accountSvc.currentID();

  this.loadState = {
    products: {
      failed: false,
      loaded: false,
    },
    assets: {
      failed: false,
      loaded: false,
    },
    subs: {
      failed: false,
      loaded: false,
    },
  };
  this.products = null;
  this.pullSecret = null;
  this.assets = null;
  this.account = null;

  this.canCancel = accountSvc.canCancelSubscription;
  this.canUncancel = accountSvc.canUncancelSubscription;

  this.isDateEmpty = function(d) {
    return (!d || !d.seconds);
  };

  this.canTakeSubscriptionAction = function(subscription) {
    if (!that.account || !$rootScope.canModifyAccount(that.account.id)) {
      return false;
    }
    return this.canCancel(subscription) || this.canUncancel(subscription);
  };

  this.productLinks = function(p) {
    var links = {
      text: 'Contact Sales',
      link: productSvc.contactLink(p),
      externalLink: p.externalLink,
    };
    if (productSvc.isPurchasable(p)) {
      links.text = 'View Pricing';
      links.link = productSvc.link(p);
    }
    return links;
  };

  this.loadSubscriptions = function() {
    that.loadState.subs = {
      failed: false,
      loaded: false,
    };
    that.subscriptions = null;
    accountSvc.listSubscriptions(accountSvc.currentID())
    .then(function(subs) {
      that.subscriptions = subs;
      that.loadState.subs.failed = false;
    })
    .catch(function(e) {
      that.loadState.subs.failed = true;
    })
    .finally(function() {
      that.loadState.subs.loaded = true;
    });
  };

  this.openCancelModal = function(subscription) {
    modalLauncherSvc.open('cancel-subscription', {
      model: subscription,
      submitFn: _.wrap(accountSvc.cancelSubscription),
      defaultErrorMessage: messageSvc.get('subscription', 'update_error'),
    }).result
    .then(that.loadSubscriptions);
  };

  this.openUncancelModal = function(subscription) {
    modalLauncherSvc.open('uncancel-subscription', {
      model: subscription,
      submitFn: _.wrap(accountSvc.uncancelSubscription),
      defaultErrorMessage: messageSvc.get('subscription', 'update_error'),
    }).result
    .then(that.loadSubscriptions);
  };

  this.listProducts = function() {
    that.loadState.products = {
      failed: false,
      loaded: false,
    };
    that.products = null;
    productSvc.list()
    .then(function(products) {
      that.products = _.filter(products, { deleted: false, public: true });
      that.loadState.products.failed = false;
    })
    .catch(function(e) {
      that.loadState.products.failed = true;
    })
    .finally(function() {
      that.loadState.products.loaded = true;
    });
  };

  this.getAssets = function() {
    that.loadState.assets = {
      failed: false,
      loaded: false,
    };
    that.assets = null;
    accountSvc.getAssets(accountSvc.currentID())
    .then(function(assets) {
      that.assets = assets;
      that.loadState.assets.failed = false;
    })
    .catch(function(e) {
      that.loadState.assets.failed = true;
    })
    .finally(function() {
      that.loadState.assets.loaded = true;
    });
  };

  function updateAccount(acct) {
    if (acct && that.account === acct) {
      return;
    }

    that.account = acct;
    if (that.account) {
      that.loadSubscriptions();
      that.getAssets();
    } else {
      that.subscriptions = [];
      that.loadState.subs.failed = false;
      that.loadState.subs.loaded = true;
      that.assets = null;
      that.loadState.assets.failed = false;
      that.loadState.assets.loaded = true;
      that.products = [];
      that.loadState.products.failed = false;
      that.loadState.products.loaded = true;
    }
  }

  $rootScope.$on('current-account-changed', function(e, acct) {
    updateAccount(acct);
  });

  if (givenAccountID) {
    accountSvc.loadByID(givenAccountID).then(updateAccount);
  } else {
    updateAccount(null);
  }

  this.listProducts();
}
