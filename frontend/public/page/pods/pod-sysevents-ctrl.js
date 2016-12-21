angular.module('bridge.page')
.controller('PodSyseventsCtrl', function($scope, $routeParams) {
  'use strict';

  $scope.ns = $routeParams.ns;
  $scope.podName = $routeParams.name;
  $scope.filter = {name: $scope.podName};
  $scope.navProps = {
    pages: [
      {name: 'Overview', href: 'details'},
      {name: 'YAML', href: 'yaml'},
      {name: 'Logs', href: 'logs'},
      {name: 'Events', href: 'events'},
    ]
  };
  $scope.props = {
    filter: $scope.filter,
    namespace: $routeParams.ns,
    podName: $routeParams.name,
  };
});
