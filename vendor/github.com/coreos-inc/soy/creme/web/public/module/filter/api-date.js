angular.module('creme.filter').filter('apiDate', function($filter, _) {
  'use strict';

  var dateFilter = $filter('date');
  // Intercepts the standard angular 'date' filter,
  // but first formats the api date format.
  return function(d, fmt) {
    var stamp;
    if (!d) {
      return '-';
    }
    if (_.isString(d)) {
      stamp = d;
    } else if (_.isNumber(d)) {
      stamp = d;
    } else if (d.seconds) {
      stamp = d.seconds * 1000;
    } else {
      return '-';
    }

    return dateFilter.apply(null, [stamp, fmt || 'MMM d, y h:mm a']);
  };

});
