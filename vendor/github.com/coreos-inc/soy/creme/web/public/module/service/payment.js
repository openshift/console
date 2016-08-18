angular.module('creme.svc')
.factory('paymentSvc', function(_, $q, $window, apiSvc, flag, messageSvc) {
  'use strict';

  var svc = {
    // gets an empty card object
    emptyCard: emptyCard,
    // gets the card on the specified account
    getCard: getCard,
    // creates a new card token given raw cc info
    createToken: createToken,
    // creates a token and saves the card to an account given raw cc info
    saveCard: saveCard,
    isCardActive: function(c) {
      return c && c.stateDescription === 'Active';
    },
  };

  // Submit request to Stripe to get credit card token.
  function createToken(card) {
    var stripeClient = $window.Stripe, req;
    if (!stripeClient || !stripeClient.setPublishableKey) {
      return $q.reject('Unable to process credit cards at this time. Refresh or try again later.');
    }
    stripeClient.setPublishableKey(flag.get('stripeKey'));
    req = {
      'number': card.number,
      'cvc': card.cvc,
      'exp_month': card.expiryMonth,
      'exp_year': card.expiryYear,
    };
    return $q(function(resolve, reject) {
      var sanitized;
      stripeClient.card.createToken(req, function(status, response) {
        if (response.error) {
          reject(response.error.message);
        } else {
          sanitized = emptyCard();
          sanitized.expiryMonth = card.expiryMonth;
          sanitized.expiryYear = card.expiryYear;
          sanitized.token = response.id;
          sanitized.lastFour = response.card.last4;
          sanitized.type = response.card.type;
          resolve(sanitized);
        }
      });
    });
  }

  function getCard(accountID) {
    return apiSvc.getCreditCard(accountID)
    .then(function(resp) {
      if (!resp || !resp.card) {
        return null;
      }
      return resp.card;
    })
    .catch(function(e) {
      if (e.status === 404) {
        return $q.when(null);
      }
      return $q.reject(e);
    });
  }

  function saveCard(accountID, cc) {
    return createToken(cc)
    .then(function(resp) {
      return apiSvc.saveCreditCard(accountID, resp.token);
    })
    .then(function(resp) {
      return resp.card;
    })
    .catch(function(reason) {
      if (reason && reason.data && reason.data.description) {
        return $q.reject(reason.data.description);
      }
      if (_.isString(reason)) {
        return $q.reject(reason);
      }
      return $q.reject(messageSvc.get('account', 'payment_error'));
    });
  }

  function emptyCard() {
    return {
      id: null,
      name: null,
      cvc: null,
      expiryMonth: null,
      expiryYear: null,
      lastFour: null,
      type: null,
      token: null,
    };
  }

  return svc;

});
