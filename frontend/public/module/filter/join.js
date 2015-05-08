// Join Filter
//
// Applies Array.prototype.join() to an array.
// Defaults to empty string for non-arrays and empty arrays.

angular.module('bridge.filter')
.filter('join', function(_) {
  'use strict';

  return function(ary, joinTxt) {
    var txt = joinTxt || ' ';
    if (_.isEmpty(ary)) {
      return '';
    }
    return ary.join(txt);
  };

});
