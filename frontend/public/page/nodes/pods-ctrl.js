angular.module('bridge.page')
.controller('nodePodsCtrl', function($scope, $routeParams, k8s) {
  'use strict';
  $scope.nodeName = $routeParams.name;
  $scope.fieldSelector = k8s.pods.fieldSelectors.nodeName($scope.nodeName);
});
