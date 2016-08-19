angular.module('creme.ui')
.directive('tecAddressForm', function(accountSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/address-form.html',
    transclude: false,
    restrict: 'E',
    replace: true,
    scope: {
      copyAddress: '=',
      editAddress: '=',
      title: '@'
    },
    link: function($scope) {
      $scope.vals = { sameAddresses: false };

      $scope.makeAddressSame = function(sameAddressesIfTrue) {
        var originalID;
        if (sameAddressesIfTrue) {
          originalID = $scope.editAddress.id;
          $scope.editAddress = angular.copy($scope.copyAddress);
          $scope.editAddress.id = originalID;
        } else {
          $scope.editAddress = accountSvc.emptyAddress();
        }
      };

      $scope.addressChanged = function() {
        $scope.vals.sameAddresses = false;
      };
    }
  };
});
