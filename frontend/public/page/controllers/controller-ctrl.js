angular.module('app')
.controller('ControllerCtrl', function($scope, ControllersSvc) {
  'use strict';

  ControllersSvc.get().then(function(result) {
    $scope.controller = result;
  });

});
