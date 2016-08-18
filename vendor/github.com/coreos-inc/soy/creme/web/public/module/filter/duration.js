angular.module('creme.filter').filter('duration', function() {
  'use strict';

  return function(duration, period, adjectiveIfTrue) {
    if (!period) {
      return '';
    }
    if (duration === 1) {
      return period.slice(0, -1);
    }
    if (adjectiveIfTrue) {
      return duration + ' ' + period.slice(0, -1);
    }

    return duration + ' ' + period;
  };
});
