
angular.module('bridge.ui')
.directive('coTpm', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/tpm.html',
    restrict: 'E',
    replace: true,
    scope: {
      name: '=',
    },
    controller: function($routeParams, $scope, k8s) {
      $scope.name = $routeParams.name;
      $scope.tpm = null;
      $scope.loadError = false;

      k8s.tpms.get($scope.name, 'default')
        .then(function(tpm) {
          $scope.tpm = tpm;
          $scope.loadError = false;
        })
        .catch(function() {
          $scope.tpm = null;
          $scope.loadError = true;
        });
    }
  };
});
