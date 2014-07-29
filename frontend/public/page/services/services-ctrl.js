angular.module('app')
.controller('ServicesCtrl', function($scope, ServicesSvc, ControllersSvc) {
  'use strict';

  ServicesSvc.list().then(function(result) {
    $scope.services = result;
  });

  $scope.open = false;

  $scope.getControllers = function(serviceId) {
    var svc = ServicesSvc.find($scope.services, serviceId);
    ControllersSvc.list({ selector: svc.selector })
      .then(function(result) {
        svc.controllers = result;
      });
  };

});
