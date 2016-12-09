angular.module('bridge.page')
.controller('nodePodsCtrl', function($scope, $routeParams) {
  'use strict';
  $scope.nodeName = $routeParams.name;
  $scope.fieldSelector = `spec.nodeName=${$scope.nodeName}`;
});
