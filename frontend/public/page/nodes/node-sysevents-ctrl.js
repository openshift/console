angular.module('bridge.page')
.controller('nodeSyseventsCtrl', function($scope, $routeParams) {
  'use strict';
  $scope.nodeName = $routeParams.name;
  $scope.navProps = {
    pages: [
      {name: 'Overview', href: 'details'},
      {name: 'Pods', href: 'pods'},
      {name: 'Events', href: 'events'},
    ]
  };
  $scope.props = {
    filter: {
      name: $scope.nodeName,
    },
  };
});
