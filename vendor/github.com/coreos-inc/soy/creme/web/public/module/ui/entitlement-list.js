angular.module('creme.ui')
.directive('tecEntitlementList', function() {
  'use strict';
  return {
    templateUrl: '/static/module/ui/entitlement-list.html',
    restrict: 'E',
    scope: {
      pricingComponents: '=',
      componentValues: '=',
    },
  };
});
