angular.module('app')
.controller('PodsCtrl', function($scope, k8s) {
  'use strict';

  k8s.pods.list().then(function(result) {
    $scope.pods = result;
  });

});
