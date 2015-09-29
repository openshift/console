angular.module('bridge.page')
.controller('NodePodsCtrl', function($scope, $routeParams, k8s) {
  'use strict';
  $scope.nodeName = $routeParams.name;
  $scope.fieldSelector = k8s.pods.fieldSelectors.nodeName($scope.nodeName);
});
