angular.module('app')
.controller('ClusterStatusCtrl', function($scope, ClusterSvc) {
  'use strict';

  ClusterSvc.etcdSummary()
    .then(function(result) {
      $scope.etcd = result;
    });

  ClusterSvc.unitSummary()
    .then(function(result) {
      $scope.units = result;
    });

});
