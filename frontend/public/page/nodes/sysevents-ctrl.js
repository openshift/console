angular.module('bridge.page')
.controller('NodeSyseventsCtrl', function($scope, $routeParams) {
  'use strict';
  $scope.nodeName = $routeParams.name;
  $scope.fieldSelector = 'involvedObject.name=' + $scope.nodeName;
});
