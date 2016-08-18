angular.module('creme.svc')
.factory('cartSvc', function(productSvc) {
  'use strict';

  var svc, cart;
  emptyCart();

  svc = {
    cart: function() {
      return cart;
    },
    isEmpty: function() {
      return _.isEmpty(cart.plan);
    },
    setItem: setItem,
    emptyCart: emptyCart,
    total: function() {
      return cart.total;
    },
  };

  function setItem(product, plan, tiers) {
    cart.product = product;
    cart.plan = plan;
    cart.tiers = tiers;
    recalculate();
    return cart;
  }

  function emptyCart() {
    cart = {
      product: null,
      plan: null,
      tiers: null,
      total: 0,
    };
    return cart;
  }

  function recalculate() {
    cart.total = 0;
    if (!cart.plan) {
      return;
    }
    cart.total = productSvc.price(cart.plan, cart.tiers);
  }

  return svc;
});

angular.module('creme.ui')
.directive('tecCart', function(cartSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/cart.html',
    transclude: false,
    restrict: 'E',
    replace: true,
    scope: {},
    controller: function($scope) {
      $scope.cart = cartSvc.cart();
      $scope.isEmpty = cartSvc.isEmpty.bind(cartSvc);
      $scope.$watch(cartSvc.cart, function(cart) {
        $scope.cart = cart;
      });
    },
  };

});
