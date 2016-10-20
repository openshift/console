angular.module('bridge.page')
.controller('ReplicationcontrollerSyseventsCtrl', function($scope, $routeParams) {
  'use strict';

  $scope.ns = $routeParams.ns;
  $scope.rcName = $routeParams.name;
  $scope.filter = {name: $scope.rcName};
  $scope.props = {
    filter: $scope.filter,
  };
});
