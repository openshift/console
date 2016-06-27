/**
 * Replace any empty values with placeholder text, otherwise display as normal.
 */
angular.module('bridge.filter')
.filter('emptyPlaceholder', function(CONST) {
  'use strict';

  return function(val, placeholder) {
    return val != null ? val : (placeholder || CONST.placeholderText);
  };

});
