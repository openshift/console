angular.module('creme.filter')
.filter('price', function($filter, _) {
  'use strict';

  var currencyFilter = $filter('currency');
  var currencySymbols = {
    'USD': '$',
  };

  return function(price, code, showCents) {
    var precision;
    if (!_.isNumber(price)) {
      return '-';
    }
    precision = showCents ? 2 : 0;
    return currencyFilter(price, currencySymbols[code || 'USD'], precision);
  };

});
