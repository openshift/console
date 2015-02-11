angular.module('app')
.controller('ServiceCtrl', function($scope, $routeParams, k8s) {
  'use strict';

  k8s.services.get($routeParams.name).then(function(service) {
    $scope.service = service;
    k8s.pods.list({ labels: service.selector })
      .then(function(pods) {
        $scope.pods = pods;
      });
  });

});
