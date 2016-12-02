angular.module('bridge.page')
.controller('ReplicationcontrollerSyseventsCtrl', function($scope, $routeParams) {
  'use strict';

  $scope.ns = $routeParams.ns;
  $scope.rcName = $routeParams.name;
  $scope.filter = {name: $scope.rcName};
  $scope.navProps = {
    pages: [
      {name: 'Overview', href: 'details'},
      {name: 'Edit', href: 'edit'},
      {name: 'Pods', href: 'pods'},
      {name: 'Events', href: 'events'},
    ]
  };
  $scope.props = {
    filter: $scope.filter,
  };
});
