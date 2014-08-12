angular.module('app')
.controller('ServicesCtrl', function($scope, ServicesSvc, PodsSvc) {
  'use strict';

  ServicesSvc.list().then(function(result) {
    $scope.services = result;
  });

  $scope.getPods = function(serviceId) {
    var svc = ServicesSvc.find($scope.services, serviceId);
    PodsSvc.list({ labels: svc.selector })
      .then(function(result) {
        svc.pods = result;
      });
  };

});
