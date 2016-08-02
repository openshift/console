angular.module('bridge.ui')

.directive('coOverflow', function() {
  'use strict';
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/static/module/ui/overflow/overflow.html',
    scope: {
      value: '='
    }
  };
});
