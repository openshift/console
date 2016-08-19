angular.module('creme.page').controller('SignupSummaryCtrl', SignupSummaryCtrl);

function SignupSummaryCtrl(_, $scope, $location, $routeParams, accountSvc, cartSvc, productSvc, signupSvc,
    modalLauncherSvc) {
  'use strict';
  var that = this;
  this.signupFlowIndex = 0;
  this.error = null;
  this.product = null;
  this.plan = null;
  this.account = null;
  this.accounts = null;
  this.cart = cartSvc.cart();
  this.knownProductNames = ['quay-enterprise', 'premium-managed-linux', 'tectonic-lab', 'tectonic-starter'];

  this.isKnownProduct = function(p) {
    return p && _.includes(this.knownProductNames, p.name);
  };

  this.openAccountSelectorModal = function() {
    modalLauncherSvc.open('account-selector', {
      accounts: this.accounts,
      defaultAccount: this.account,
    }).result
    .then(function(account) {
      if (account) {
        if (account.id !== that.account.id) {
          // Switch to using a different account the user selected for signup.
          accountSvc.setCurrent(account);
          signupSvc.saveAccount(account);
        }
      } else {
        // reset everything and use a new empty account
        accountSvc.setCurrent(null);
        signupSvc.useNewAccount();
      }
      that.initAccount();
    });
  };

  this.initAccount = function() {
    this.account = signupSvc.account();
    if (signupSvc.isAccountComplete()) {
      this.signupComplete = true;
      this.btnText = 'Next, Confirm Order';
    } else {
      this.signupComplete = false;
      this.btnText = 'Next, Enter Contact Info';
    }
  };

  this.submit = function() {
    if (this.signupComplete) {
      $location.path('/signup/confirm');
      return;
    }
    $location.path('/signup/contact');
  };

  accountSvc.list()
  .then(function(accts) {
    var currentID = accountSvc.currentID();
    that.accounts = accts;
    return accountSvc.loadByID(currentID);
  })
  .then(function(acct) {
    that.account = acct;

    that.initAccount();
    if (that.accounts && that.accounts.length > 0) {
      signupSvc.uninitialize();
      that.openAccountSelectorModal();
    }
  });

  // Load the product based on the route params.
  if ($routeParams.productName) {
    this.product = signupSvc.selectProduct($routeParams.productName);
    if (!signupSvc.getSelectedProduct()) {
      $location.path('/products');
      return;
    }
  }

  // Load the plan based on the route params.
  this.plan = signupSvc.selectPlan($routeParams.planName);
  if (!this.plan && this.product.ratePlans && this.product.ratePlans.length === 1) {
    this.plan = signupSvc.selectPlan(this.product.ratePlans[0].name);
  }
  this.selectedTiers = signupSvc.getSelectedTiers();

}
