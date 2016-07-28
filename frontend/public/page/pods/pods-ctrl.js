angular.module('bridge.page')
.controller('PodsCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  $scope.props = {
    namespace: $routeParams.ns,
    defaultNS: k8s.enum.DefaultNS,
    kind: 'pods',
  };
});
