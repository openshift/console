angular.module('creme.ui')
.directive('tecCreditCardFields', function() {
  'use strict';

  // This directive does not define it's own form.  Individual fields
  // define some validation (required-ness, min-length, etc) but they
  // will only be applied in the context of a parent form.

  return {
    templateUrl: '/static/module/ui/credit-card-fields.html',
    restrict: 'E',
    scope: {
      card: '=',
      required: '='
    },
  };
})

.directive('tecCardView', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/credit-card-view.html',
    transclude: false,
    scope: {
      card: '=',
    },
  };
});
