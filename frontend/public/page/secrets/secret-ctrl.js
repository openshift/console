angular.module('bridge.page')
.controller('SecretCtrl', function($scope, $routeParams) {
  'use strict';
  $scope.name = $routeParams.name;
});
