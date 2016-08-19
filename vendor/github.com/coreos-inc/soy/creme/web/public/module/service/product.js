angular.module('creme.svc')
.factory('productSvc', function(apiSvc, _, $q) {
  'use strict';

  var products, svc, fakeQuayHosted;

  svc = {
    list: list,

    isPurchasable: function(p) {
      return p.id === 'quayio-hosted' || !_.isEmpty(p.ratePlans);
    },

    link: function(p) {
      if (p.id === 'quayio-hosted') {
        return 'https://quay.io/plans';
      }
      return '/signup/summary/' + p.name;
    },

    contactLink: contactLink,
    price: price,
  };

  fakeQuayHosted = {
    'deleted': false,
    'externalLink': 'https://quay.io',
    'id': 'quayio-hosted',
    'name': 'quayio-hosted',
    'order': 30,
    'productType': 'non-recurring',
    'public': true,
    'publicName': 'Quay.io (Hosted)',
    'ratePlans': null,
  };

  function price(plan, tiers) {
    var costPC, total;
    if (!plan || !plan.pricingComponents) {
      return '-';
    }

    // A "cost" pricing component gets priority in determining the price.
    costPC = _.findWhere(plan.pricingComponents, { name: 'cost' });
    if (costPC && costPC.tiers.length) {
      return costPC.tiers[0].price;
    }

    if (_.isEmpty(tiers)) {
      return '-';
    }

    // Otherwise price is determined by all selected tiers prices combined.
    total = 0;
    _.each(tiers, function(t) {
      total += t.price;
    });
    return total;
  }

  function contactLink(prod, plan) {
    var link = 'https://tectonic.com/contact/?';
    if (prod && prod.name) {
      link += '&product=' + prod.name;
    }
    if (plan && plan.name) {
      link += '&plan=' + plan.name;
    }
    return link;
  }

  function list() {
    return apiSvc.listProducts()
    .then(function(resp) {
      if (resp.items && resp.items.length) {
        products = resp.items;
      } else {
        products = [];
      }
      products.push(fakeQuayHosted);
      return products;
    });
  }

  return svc;

});
