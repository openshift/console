angular.module('app')
.controller('ConfigurePortsCtrl', function(_, $scope, $modalInstance, ports,
      arraySvc) {
  'use strict';

  if (_.isEmpty(ports)) {
    $scope.ports = [{
      hostPort: null,
      containerPort: null,
      name: null,
    }];
  } else {
    $scope.ports = ports;
  }

  $scope.clearRow = function(item) {
    if ($scope.ports.length === 1) {
      item.hostPort = null;
      item.containerPort = null;
      item.name = null;
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
