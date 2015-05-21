angular.module('bridge.page')
.controller('MachineSyseventsCtrl', function($scope, $routeParams) {
  'use strict';
  $scope.machineName = $routeParams.name;
  $scope.fieldSelector = 'involvedObject.name=' + $scope.machineName;
});
