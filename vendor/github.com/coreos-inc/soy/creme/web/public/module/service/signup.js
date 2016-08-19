angular.module('creme.svc')
.factory('signupSvc', function($q, $log, $rootScope, _, apiSvc, localStorageSvc, productSvc, accountSvc, cartSvc,
      paymentSvc) {
  'use strict';

  var svc, data, products, initialized;

  initialized = false;

  function clearData() {
    data = {
      account: null,
      mailingAddress: null,
      billingAddress: null,
      creditCard: null,
      paymentMethod: null,
      preferences: null,
      selectedProduct: null,
      selectedPlan: null,
      selectedTiers: null,
    };
  }

  svc = {
    // Load all state required for signup depending on phase.
    init: init,
    submit: submit,
    account: function() {
      return angular.copy(data.account);
    },
    saveAccount: saveAccount,
    saveProfile: saveProfile,
    mailingAddress: function() {
      return angular.copy(data.mailingAddress);
    },
    saveMailingAddress: saveMailingAddress,
    billingAddress: function() {
      return angular.copy(data.billingAddress);
    },
    saveBillingAddress: saveBillingAddress,
    creditCard: function() {
      return angular.copy(data.creditCard);
    },
    saveCreditCard: saveCreditCard,
    paymentMethod: function() {
      return angular.copy(data.paymentMethod);
    },
    savePaymentMethod: savePaymentMethod,
    preferences: function() {
      return angular.copy(data.preferences);
    },
    savePreferences: savePreferences,
    selectProduct: selectProduct,
    getSelectedProduct: function() {
      return data.selectedProduct;
    },
    selectPlan: selectPlan,
    getSelectedPlan: function() {
      return data.selectedPlan;
    },
    selectTiers: selectTiers,
    getSelectedTiers: function() {
      return data.selectedTiers;
    },
    isAccountComplete: function() {
      // TODO: more robust check that account is fully complete
      return data.account && data.account.id;
    },
    useNewAccount: useNewAccount,
    uninitialize: function() {
      initialized = false;
    },
  };

  function useNewAccount() {
    clearStorage();
    saveAccount(accountSvc.emptyAccount());
    saveCreditCard(paymentSvc.emptyCard(), true);
    savePreferences(emptyPreferences());
    savePaymentMethod('credit-card');
    initialized = true;
  }

  function saveProfile(p) {
    if (!p) {
      return;
    }
    data.account.profile = angular.copy(p);
    saveToStorage();
  }

  function saveMailingAddress(a) {
    if (!a) {
      return;
    }
    data.mailingAddress = angular.copy(a);
    saveToStorage();
  }

  function saveBillingAddress(a) {
    if (!a) {
      return;
    }
    data.billingAddress = angular.copy(a);
    saveToStorage();
  }

  function saveCreditCard(card, localOnly) {
    if (localOnly) {
      persistCard(card);
      return $q.when(angular.copy(data.creditCard));
    }

    return paymentSvc.createToken(card)
    .then(function(result) {
      persistCard(result);
      return angular.copy(data.creditCard);
    });
  }

  function savePreferences(p) {
    data.preferences = angular.copy(p);
    saveToStorage();
  }

  function savePaymentMethod(p) {
    data.paymentMethod = p;
    saveToStorage();
  }

  function saveAccount(a) {
    data.account = a;
    data.mailingAddress = accountSvc.mailingAddress(a);
    data.billingAddress = accountSvc.billingAddress(a);
    saveToStorage();
  }

  function persistCard(card) {
    data.creditCard = card;
    data.creditCard.number = null;
    saveToStorage();
  }

  // gets a copy of the product with all non-purchasable plans filtered out
  function selectProduct(name) {
    var p = _.findWhere(products, { name: name });
    p = angular.copy(p);
    if (p.ratePlans) {
      p.ratePlans = _.filter(p.ratePlans, productSvc.isPurchaseable);
    }
    data.selectedProduct = p;
    data.selectedTiers = null;
    saveToStorage();
    return data.selectedProduct;
  }

  function selectPlan(name) {
    if (!data.selectedProduct) {
      $log.log('cant select a plan without selecting a product first');
      return null;
    }
    cartSvc.emptyCart();

    data.selectedPlan = _.findWhere(data.selectedProduct.ratePlans, { name: name });
    data.selectedTiers = null;
    cartSvc.setItem(data.selectedProduct, data.selectedPlan);
    saveToStorage();
    return data.selectedPlan;
  }

  function selectTiers(tiers) {
    if (!data.selectedPlan) {
      $log.log('cant select a tier without selecting a plan first');
      return null;
    }

    if (_.isEmpty(tiers)) {
      return null;
    }

    data.selectedTiers = tiers;
    cartSvc.emptyCart();
    cartSvc.setItem(data.selectedProduct, data.selectedPlan, data.selectedTiers);
    saveToStorage();
    return data.selectedTiers;
  }

  function init() {
    var opPromises;

    if (initialized) {
      return $q.when('initialized');
    }

    opPromises = [productSvc.list(), accountSvc.list()];
    return $q.all(opPromises)
    .then(function(resp) {
      var currentID = accountSvc.currentID();
      products = resp[0];
      return accountSvc.loadByID(currentID);
    })
    .then(function(currAcct) {
      var cache = localStorageSvc.getWithUserScope('signupData') || {};

      data.account = cache.account || accountSvc.emptyAccount();
      data.mailingAddress = cache.mailingAddress || accountSvc.emptyAddress();
      data.billingAddress = cache.billingAddress || accountSvc.emptyAddress();
      data.creditCard = cache.creditCard || paymentSvc.emptyCard();
      data.paymentMethod = cache.paymentMethod || 'credit-card';

      data.preferences = cache.preferences || emptyPreferences();
      data.selectedProduct = cache.selectedProduct || null;
      data.selectedPlan = cache.selectedPlan || null;
      data.selectedTiers = cache.selectedTiers || null;

      cartSvc.setItem(data.selectedProduct, data.selectedPlan, data.selectedTiers);

      if (currAcct && currAcct.id) {
        data.account = angular.copy(currAcct);
        data.mailingAddress = accountSvc.mailingAddress(data.account);
        data.billingAddress = accountSvc.billingAddress(data.account);
        return paymentSvc.getCard(currAcct.id)
        .then(function(card) {
          if (card) {
            data.paymentMethod = 'credit-card';
            data.creditCard = card;
          } else {
            data.paymentMethod = 'purchase-order';
            data.creditCard = paymentSvc.emptyCard();
          }
          initialized = true;
        });
      }

      initialized = true;
    });
  }

  function saveToStorage() {
    // TODO sanitize card data first
    localStorageSvc.setWithUserScope('signupData', data);
  }

  function clearStorage() {
    localStorageSvc.removeItemWithUserScope('signupData');
  }

  function emptyPreferences() {
    return {
      changelogEmail: true,
      newsletterEmail: true,
    };
  }

  function tiersToQuantities(tiers) {
    return _.map(tiers, function(t) {
      return {
        pricingComponent: t.pricingComponentID,
        quantity: t.upperThreshold,
      };
    });
  }

  function submit() {
    var req = {
      account: data.account,
      billingAddress: data.billingAddress,
      mailingAddress: data.mailingAddress,
      paymentMethod: data.paymentMethod,
      creditCardToken: data.creditCard.token,
      productID: data.selectedProduct.id,
      planID: data.selectedPlan.id,
      quantities: tiersToQuantities(data.selectedTiers),
      changelogEmail: data.preferences.changelogEmail,
      newsletterEmail: data.preferences.newsletterEmail,
      agreedTOS: true,
    };
    return apiSvc.submitSignup(req)
    .then(function(resp) {
      var isNewAccount = !data.account.id;
      cartSvc.emptyCart();
      clearStorage();
      clearData();
      initialized = false;
      if (isNewAccount) {
        accountSvc.list()
        .then(function() {
          // Make sure "current" selected account is the one that was just created.
          accountSvc.setCurrent(resp.data.account);
        });
        $rootScope.$emit('new-account-created');
      } else {
        // Make sure "current" selected account is the one that was just updated.
        accountSvc.setCurrent(resp.data.account);
      }
    });
  }

  clearData();

  $rootScope.$on('current-account-changed', function() {
    initialized = false;
  });

  return svc;

});
