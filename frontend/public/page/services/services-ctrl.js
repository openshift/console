angular.module('app')
.controller('ServicesCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  $scope.defaultNS = k8s.enum.DefaultNS;
  $scope.ns = $routeParams.ns;
});
