angular.module('bridge.page')
.controller('DaemonSetCtrl', function($scope, $routeParams) {
  'use strict';
  $scope.name = $routeParams.name;
});
