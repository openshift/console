angular.module('app')
.controller('AppsCtrl', function($scope, $routeParams, $location, k8s) {
  'use strict';

  $scope.ns = $routeParams.ns || k8s.enum.DefaultNS;
  $scope.defaultNS = k8s.enum.DefaultNS;

});
