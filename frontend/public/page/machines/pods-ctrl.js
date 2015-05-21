angular.module('bridge.page')
.controller('MachinePodsCtrl', function($scope, $routeParams, k8s) {
  'use strict';
  $scope.machineName = $routeParams.name;
  $scope.fieldSelector = k8s.pods.fieldSelectors.nodeName($scope.machineName);
});
