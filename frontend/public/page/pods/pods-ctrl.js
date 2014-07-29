angular.module('app')
.controller('PodsCtrl', function($scope, PodsSvc) {
  'use strict';

  PodsSvc.list().then(function(result) {
    $scope.pods = result;
  });

});
