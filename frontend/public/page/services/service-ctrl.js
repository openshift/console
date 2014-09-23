angular.module('app')
.controller('ServiceCtrl', function($scope, $routeParams, ServicesSvc, PodsSvc) {
  'use strict';

  ServicesSvc.get({ id: $routeParams.id }).then(function(result) {
    $scope.service = result.data;
    PodsSvc.list({ labels: $scope.service.selector })
      .then(function(result) {
        $scope.pods = result.data.items;
      });
  });

});
