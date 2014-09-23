angular.module('app')
.controller('ServicesCtrl', function($scope, ServicesSvc, PodsSvc, EVENTS, arraySvc) {
  'use strict';

  $scope.fetch = function() {
    ServicesSvc.list().then(function(result) {
      $scope.services = result.data.items;
    });
  };

  $scope.getPods = function(serviceId) {
    var svc = ServicesSvc.find($scope.services, serviceId);
    PodsSvc.list({ labels: svc.selector })
      .then(function(result) {
        svc.pods = result.data.items;
      });
  };

  $scope.$on(EVENTS.SERVICE_DELETE, function(e, service) {
    arraySvc.remove($scope.services, service);
  });

  $scope.fetch();

});
