angular.module('creme.ui')
.directive('tecPaymentMethodFields', function(paymentSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/payment-method-fields.html',
    restrict: 'E',
    scope: {
      fields: '=',
    },
    controller: function($scope) {
      $scope.hasActiveCard = $scope.fields.accountID && paymentSvc.isCardActive($scope.fields.card);
    },
  };

});
