angular.module('bridge.page')
.controller('PodsCtrl', function($scope, k8s) {
  'use strict';
  $scope.kind = k8s.enum.Kind.POD;
});
