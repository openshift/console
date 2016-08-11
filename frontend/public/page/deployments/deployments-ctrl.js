angular.module('bridge.page')
.controller('DeploymentsCtrl', function($scope, k8s) {
  'use strict';

  $scope.kind = k8s.enum.Kind.DEPLOYMENT;
});
