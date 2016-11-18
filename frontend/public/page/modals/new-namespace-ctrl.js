import {CONST} from '../../const';

angular.module('bridge.page')
.controller('NewNamespaceCtrl', function($scope, k8s) {
  'use strict';

  $scope.namePattern = CONST.legalNamePattern;

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
