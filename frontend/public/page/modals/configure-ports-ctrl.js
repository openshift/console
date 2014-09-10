angular.module('app')
.controller('ConfigurePortsCtrl', function(_, $scope, $modalInstance, ports,
      arraySvc) {
  'use strict';

  function getEmptyPort() {
    return {
      hostPort: null,
      containerPort: null,
      name: null,
      protocol: 'TCP',
    };
  }

  if (_.isEmpty(ports)) {
    $scope.ports = [getEmptyPort()];
  } else {
    $scope.ports = ports;
  }

  $scope.clearRow = function(item) {
    if ($scope.ports.length === 1) {
      $scope.ports = [getEmptyPort()];
    } else {
      arraySvc.remove($scope.ports, item);
    }
  };

  $scope.save = function() {
    $modalInstance.close($scope.ports);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

})
.controller('ConfigurePortsFormCtrl', function($scope) {

  $scope.submit = $scope.save;

});
