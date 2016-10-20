angular.module('bridge.page')
.controller('EventsCtrl', function($scope, $routeParams) {
  'use strict';

  $scope.ns = $routeParams.ns;
  $scope.query = {kind: '', category: ''};
  $scope.props = {
    namespace: $routeParams.ns,
  };
});
