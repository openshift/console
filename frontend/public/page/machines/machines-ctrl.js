angular.module('app')
.controller('MachinesCtrl', function($scope, k8s) {
  'use strict';

  k8s.nodes.list().then(function(nodes) {
    $scope.nodes = nodes;
  });

});
