angular.module('bridge.page')
.controller('PodSyseventsCtrl', function($scope, $routeParams) {
  'use strict';

  $scope.ns = $routeParams.ns;
  $scope.podName = $routeParams.name;
  $scope.fieldSelector = 'involvedObject.name=' + $scope.podName;
});
