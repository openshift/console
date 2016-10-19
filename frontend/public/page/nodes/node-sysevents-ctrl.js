angular.module('bridge.page')
.controller('nodeSyseventsCtrl', function($scope, $routeParams) {
  'use strict';
  $scope.nodeName = $routeParams.name;
  $scope.fieldSelector = 'involvedObject.name=' + $scope.nodeName;
  $scope.props = {
    filter: {
      name: $scope.nodeName,
    },
  };
});
