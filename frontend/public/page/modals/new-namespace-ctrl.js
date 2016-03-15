angular.module('bridge.page')
.controller('NewNamespaceCtrl', function(k8s, $scope) {
  'use strict';

  $scope.model = {
    name: null,
    labels: {}
  };

  $scope.createNamespace = function(form) {
    if (form.$valid) {
      $scope.namespaceCreated = k8s.namespaces.create({
        metadata: {
          name: $scope.model.name,
          labels: $scope.model.labels,
        }
      });
      $scope.namespaceCreated.then($scope.$close);
    }
  };
});
