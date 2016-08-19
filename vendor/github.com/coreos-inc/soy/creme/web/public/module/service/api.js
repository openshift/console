angular.module('creme.svc')
.factory('apiSvc', function($http, $q, _) {
  'use strict';

  var svc, apiBasePath = '/api/v1';

  svc = {
    listAccounts: listAccounts,
    listProducts: listProducts,
    listInvoices: listInvoices,
    getInvoicePDFLink: getInvoicePDFLink,
    submitSignup: submitSignup,
    upsertAddress: upsertAddress,
    updateAccount: updateAccount,
    listSubscriptions: listSubscriptions,
    getCreditCard: getCreditCard,
    saveCreditCard: saveCreditCard,
    getBillingStatus: getBillingStatus,
    cancelSubscription: cancelSubscription,
    uncancelSubscription: uncancelSubscription,
    terminateAccount: terminateAccount,
    listUsers: listAccountUsers,
    inviteUser: inviteAccountUser,
    changeUserRole: changeAccountUserRole,
    revokeAccountUser: revokeAccountUser,
    revokeInvitedUser: revokeInvitedUser,
    getUser: getUser,
    getAssets: getAssets,
  };

  function getUser(userID) {
    return $http({
      url: endpoint('/users/' + userID),
      method: 'GET',
    })
    .then(checkResponseData);
  }

  function getAssets(accountID) {
    return $http({
      url: endpoint('/accounts/' + accountID + '/license'),
      method: 'GET',
    })
    .then(checkResponseData);
  }

  function listAccountUsers(accountID) {
    return $http({
      url: endpoint('/accounts/' + accountID + '/users'),
      method: 'GET',
    })
    .then(checkResponseData);
  }

  function inviteAccountUser(accountID, user) {
    return $http({
      url: endpoint('/accounts/' + accountID + '/users'),
      method: 'POST',
      data: user,
    })
    .then(checkResponseData);
  }

  function changeAccountUserRole(accountID, user) {
    return $http({
      url: endpoint('/accounts/' + accountID + '/users/' + user.dexID + '/role'),
      method: 'POST',
      data: {
        role: user.role,
      },
    })
    .then(checkResponseData);
  }

  function revokeAccountUser(accountID, user) {
    return $http({
      url: endpoint('/accounts/' + accountID + '/users/' + user.dexID),
      method: 'DELETE',
    })
    .then(checkResponseData);
  }

  function revokeInvitedUser(accountID, user) {
    return $http({
      url: endpoint('/accounts/' + accountID + '/invited-users/' + user.email),
      method: 'DELETE',
    })
    .then(checkResponseData);
  }

  function cancelSubscription(sub) {
    return $http({
      url: endpoint('/accounts/' + sub.accountID + '/subscriptions/' + sub.id + '/cancel'),
      method: 'POST',
      data: {
        accountID: sub.accountID,
        subscriptionID: sub.subscriptionID,
      },
    })
    .then(checkResponseData);
  }

  function uncancelSubscription(sub) {
    return $http({
      url: endpoint('/accounts/' + sub.accountID + '/subscriptions/' + sub.id + '/uncancel'),
      method: 'POST',
      data: {
        accountID: sub.accountID,
        subscriptionID: sub.subscriptionID,
      }
    })
    .then(checkResponseData);
  }

  function terminateAccount(accountID) {
    return $http({
      url: endpoint('/accounts/' + accountID),
      method: 'DELETE',
    })
    .then(checkResponseData);
  }

  function getBillingStatus(accountID) {
    return $http({
      url: endpoint('/accounts/' + accountID + '/billing-status'),
      method: 'GET',
    })
    .then(checkResponseData);
  }

  function getCreditCard(accountID) {
    return $http({
      url: endpoint('/accounts/' + accountID + '/card'),
      method: 'GET',
    })
    .then(checkResponseData)
    .then(function(resp) {
      // NOTE(sym3tri): hack b/c BF stores 2 digit years. WTF?
      resp.card.expiryYear = '20' + resp.card.expiryYear;
      return resp;
    });
  }

  function saveCreditCard(accountID, token) {
    return $http({
      url: endpoint('/accounts/' + accountID + '/card'),
      method: 'POST',
      data: {
        accountID: accountID,
        token: token,
      },
    })
    .then(checkResponseData)
    .then(function(resp) {
      // NOTE(sym3tri): hack b/c BF stores 2 digit years. WTF?
      resp.card.expiryYear = '20' + resp.card.expiryYear;
      return resp;
    });
  }

  function getInvoicePDFLink(accountID, invoiceID) {
    return endpoint('/accounts/' + accountID + '/invoices/' + invoiceID);
  }

  function listInvoices(accountID) {
    return $http({
      url: endpoint('/accounts/' + accountID + '/invoices'),
      method: 'GET',
    })
    .then(checkResponseData);
  }

  function listSubscriptions(accountID) {
    return $http({
      url: endpoint('/accounts/' + accountID + '/subscriptions'),
      method: 'GET',
    })
    .then(checkResponseData);
  }

  function listAccounts() {
    return $http({
      url: endpoint('/accounts'),
      method: 'GET',
    })
    .then(checkResponseData);
  }

  function listProducts() {
    return $http({
      url: endpoint('/products'),
      method: 'GET',
    })
    .then(checkResponseData)
    .then(function(resp) {
      if (!resp.items) {
        resp.items = [];
      }
      return resp;
    });
  }

  function submitSignup(d) {
    return $http({
      url: endpoint('/signup'),
      method: 'POST',
      data: d,
    });
  }

  // Updates everything except the addresses.
  function updateAccount(account) {
    return $http({
      url: endpoint('/accounts/' + account.id),
      method: 'PUT',
      data: account,
    })
    .then(checkResponseData);
  }

  // Upserts a single address.
  function upsertAddress(accountID, address) {
    return $http({
      url: endpoint('/accounts/' + accountID + '/addresses'),
      method: 'POST',
      data: address,
    })
    .then(checkResponseData);
  }

  function endpoint(path) {
    return apiBasePath + path;
  }

  function checkResponseData(resp) {
    if (!resp || !resp.data) {
      return $q.reject('Invalid API response.');
    }
    return resp.data;
  }

  function saveAddress(addr) {
    return $http({
      url: endpoint('/addresses/' + addr.id),
      method: 'PUT',
      data: addr,
    })
    .then(checkResponseData);
  }

  return svc;

});
