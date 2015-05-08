// Custom Date Filter
//
// Formats a date/time string/date value based on the formatter constant.
// Invalid/unparsable dates return placeholder text constant.

angular.module('bridge.filter')
.filter('customDate', function($filter, _, CONST) {
  'use strict';

  var dateFilter = $filter('date');

  return function(val) {
    var date;
    if (!val) {
      return CONST.placeholderText;
    }
    // Ensure this is a real parseable date.
    date = new Date(Date.parse(val));
    if (!_.isDate(date) || date.getFullYear() === 0) {
      return CONST.placeholderText;
    }
    return dateFilter(val, CONST.dateTimeFmt);
  };

});
