angular.module('bridge.page')
.controller('ConfigMapCtrl', function($scope, $routeParams) {
  'use strict';
  $scope.name = $routeParams.name;
});
