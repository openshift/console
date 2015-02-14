angular.module('app')
.controller('ServiceCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  k8s.services.get($routeParams.name).then(function(service) {
    $scope.service = service;
    if (!service.spec.selector) {
      return;
    }
    k8s.pods.list({ labels: service.spec.selector })
      .then(function(pods) {
        $scope.pods = pods;
      });
  });

});
