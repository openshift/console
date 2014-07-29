angular.module('app')
.controller('ControllersCtrl', function($scope, ControllersSvc) {
  'use strict';

  ControllersSvc.list().then(function(result) {
    $scope.controllers = result;
  });

});
