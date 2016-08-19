angular.module('creme.ui')
.directive('tecAddressView', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/address-view.html',
    transclude: false,
    restrict: 'E',
    scope: {
      address: '=',
    },
  };
});
