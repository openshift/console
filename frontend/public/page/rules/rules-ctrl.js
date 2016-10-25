angular.module('bridge.page')
.controller('editRulesCtrl', function($scope, $routeParams, $window, k8s) {
  'use strict';
  const k8sResource = k8s.roles;

  $scope.props = {
    k8sResource,
    rule: $routeParams.rule,
    name: $routeParams.name,
    namespace: $routeParams.ns,
  };

  const kind = k8sResource.kind;
  $scope.title = 'Create Access Rule';
  $scope.component = 'EditRule';
  $window.document.title = `Tectonic - ${kind.labelPlural}`;
});
