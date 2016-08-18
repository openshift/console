angular.module('creme.svc').factory('accountSvc', function(_, $q, $rootScope, apiSvc, productSvc, localStorageSvc,
      authSvc, SUBSCRIPTION_STATE) {
  'use strict';

  var accounts, currentAccountID, svc,
      invoices = {},
      users = {},
      subscriptions = {};

  svc = {
    list: list,
    get: get,
    terminate: apiSvc.terminateAccount,
    currentID: function() {
      return currentAccountID;
    },
    loadByID: function(id) {
      var acct = _.findWhere(accounts, { id: id });
      if (acct) {
        return $q.when(acct);
      }

      return load()
      .then(function() {
        return _.findWhere(accounts, { id: id });
      });
    },
    setCurrent: function(account) {
      var storeID = account ? account.id : null;
      currentAccountID = storeID;
      localStorageSvc.setWithUserScope('currentAccountID', storeID);
      $rootScope.$emit('current-account-changed', account);
    },
    hasAccount: function() {
      return accounts && accounts.length;
    },
    emptyAddress: emptyAddress,
    emptyAccount: emptyAccount,
    mailingAddress: mailingAddress,
    billingAddress: billingAddress,
    upsertAddress: upsertAddress,
    update: updateAccount,
    listInvoices: listInvoices,
    getInvoicePDFLink: apiSvc.getInvoicePDFLink,
    listSubscriptions: listSubscriptions,
    isAddressEmpty: isAddressEmpty,
    getBillingStatus: apiSvc.getBillingStatus,
    canCancelSubscription: canCancelSubscription,
    canUncancelSubscription: canUncancelSubscription,
    cancelSubscription: apiSvc.cancelSubscription,
    uncancelSubscription: apiSvc.uncancelSubscription,
    listUsers: listUsers,
    inviteUser: apiSvc.inviteUser,
    changeUserRole: apiSvc.changeUserRole,
    revokeUser: apiSvc.revokeAccountUser,
    revokeInvitedUser: apiSvc.revokeInvitedUser,
    getAssets: getAssets,
  };

  function getAssets(accountID) {
    return apiSvc.getAssets(accountID)
    .then(function(resp) {
      if (!resp || !resp.assets) {
        return null;
      }
      return resp.assets;
    })
    .catch(function(e) {
      if (e.status === 404) {
        return $q.when(null);
      }
      return $q.reject(e);
    });
  }

  function canCancelSubscription(s) {
    var okStates = [
      SUBSCRIPTION_STATE.PAID,
      SUBSCRIPTION_STATE.AWAITING_PAYMENT,
    ];
    return s && _.includes(okStates, s.state) && s.product.productType === 'recurring';
  }

  function canUncancelSubscription(s) {
    var okStates = [
      SUBSCRIPTION_STATE.CANCELLED,
    ];

    // This defn. of "Cancelled but not really cancelled" is from
    // BillForward - date is either not present/empty, or present and
    // in the future.
    return s &&
      s.state === SUBSCRIPTION_STATE.CANCELLED &&
      s.product.productType === 'recurring' &&
      (!s.subscriptionEnd ||
       !s.subscriptionEnd.seconds ||
       s.subscriptionEnd.seconds > (new Date() / 1000));
  }

  function isAddressEmpty(a) {
    if (a.id) {
      return false;
    }
    return !(a.addressLine1 && a.city &&
        a.province && a.country && a.postcode && a.landline);
  }

  function listSubscriptions(accountID) {
    return apiSvc.listSubscriptions(accountID)
    .then(function(resp) {
      subscriptions[accountID] = null;
      if (!_.isEmpty(resp)) {
        resp.children = _.sortBy(resp.children, function(s) {
          return s.initialPeriodStart.seconds;
        });
        subscriptions[accountID] = resp;
      }
      return subscriptions[accountID];
    });
  }

  function listInvoices(accountID) {
    return apiSvc.listInvoices(accountID)
    .then(function(resp) {
      invoices[accountID] = [];
      if (resp.invoices && resp.invoices.length) {
        invoices[accountID] = resp.invoices;
      }
      return invoices[accountID];
    });
  }

  function list() {
    return load()
    .then(function() {
      if (_.isEmpty(accounts) || currentAccountID) {
        // Can't (or don't need to) set current account to accounts[0]
      } else {
        svc.setCurrent(accounts[0]);
      }

      return angular.copy(accounts);
    });
  }

  function listUsers(accountID) {
    return apiSvc.listUsers(accountID)
    .then(function(resp) {
      users[accountID] = [];
      if (resp.items && resp.items.length) {
        users[accountID] = resp.items;
      }
      return users[accountID];
    });
  }

  function findAccountByID (id) {
    return _.findWhere(accounts, { id: id });
  }

  function get(id) {
    return load()
    .then(_.bind(findAccountByID, null, id));
  }

  function updateAccount(account) {
    return apiSvc.updateAccount(account)
    .then(load)
    .then(_.bind(findAccountByID, null, account.id));
  }

  function upsertAddress(accountID, addr) {
    var acct = findAccountByID(accountID);
    addr.profileID = acct.profile.id;

    return apiSvc.upsertAddress(accountID, addr)
    .then(_.bind(load, null, true))
    .then(function() {
      acct = findAccountByID(accountID);
      return _.findWhere(acct.profile.addresses, { id: addr.id });
    });
  }

  function mailingAddress(acct) {
    var a = _.findWhere(acct.profile.addresses, { primaryAddress: false });
    if (!a) {
      a = emptyAddress();
      a.profileID = acct.profile.id;
      a.primaryAddress = false;
    }
    return a;
  }

  function billingAddress(acct) {
    var a = _.findWhere(acct.profile.addresses, { primaryAddress: true });
    if (!a) {
      a = emptyAddress();
      a.profileID = acct.profile.id;
      a.primaryAddress = true;
    }
    return a;
  }

  function emptyAddress() {
    return {
      addressLine1: null,
      addressLine2: null,
      city: null,
      province: null,
      country: null,
      postcode: null,
      landline: null,
      primaryAddress: null,
    };
  }

  function emptyAccount() {
    return {
      id: null,
      metadata: {},
      profile: {
        id: null,
        metadata: {},
        email: null,
        companyName: null,
        firstName: null,
        lastName: null,
        landline: null,
        addresses: []
      },
    };
  }

  function load() {
    return apiSvc.listAccounts()
    .then(function(resp) {
      if (resp.items && resp.items.length) {
        accounts = resp.items;
      } else {
        accounts = [];
      }
      _.each(accounts, function(a) {
        if (a.profile && !_.isEmpty(a.profile.addresses)) {
          // Safeguard against any empty addresses returned from API showing up in profile data.
          a.profile.addresses = _.filter(a.profile.addresses, _.negate(isAddressEmpty));
        }
      });
      return accounts;
    });
  }

  currentAccountID = localStorageSvc.getWithUserScope('currentAccountID') || null;
  return svc;
});
