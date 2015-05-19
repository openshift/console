angular.module('bridge.page')
.controller('PodSyseventsCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.podName = $routeParams.name;
  $scope.fieldSelector = 'involvedObject.name=' + $scope.podName;
});
