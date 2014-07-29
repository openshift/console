angular.module('app')
.controller('PodCtrl', function($scope, PodsSvc) {
  'use strict';

  PodsSvc.get().then(function(result) {
    $scope.pod = result;
  });

});
