angular.module('bridge.page')
.controller('nodePodsCtrl', function($scope, $routeParams) {
  'use strict';
  $scope.nodeName = $routeParams.name;
  $scope.fieldSelector = `spec.nodeName=${$scope.nodeName}`;
  $scope.navProps = {
    pages: [
      {name: 'Overview', href: 'details'},
      {name: 'YAML', href: 'yaml'},
      {name: 'Pods', href: 'pods'},
      {name: 'Events', href: 'events'},
    ]
  };
});
