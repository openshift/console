angular.module('creme.ui').directive('tecAssetView', function(_, $window) {
  'use strict';

  function blob(data, encoding) {
    return new Blob([data], { type: encoding || 'text/plain' });
  }

  return {
    templateUrl: '/static/module/ui/asset-view.html',
    restrict: 'E',
    scope: {
      asset: '=',
    },
    controller: function($scope) {
      $scope.tabNames = [];
      if ($scope.asset && $scope.asset.formats) {
        $scope.tabNames = _.keys($scope.asset.formats);
        $scope.tabNames.sort();
        $scope.chosenName = $scope.tabNames[0];
      }

      $scope.$on('tab-changed', function(e, name) {
        if (!name || !$scope.asset || !$scope.asset.formats || !$scope.asset.formats[name]) {
          return;
        }
        $scope.activeFmt = $scope.asset.formats[name];
        $scope.activeLink = $window.URL.createObjectURL(blob($scope.activeFmt.value));
      });
    },
  };
});
