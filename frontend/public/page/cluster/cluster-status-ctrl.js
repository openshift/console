angular.module('bridge.page')
.controller('ClusterStatusCtrl', function($scope, _, ClusterSvc) {
  'use strict';

  ClusterSvc.etcdSummary()
    .then(function(result) {
      $scope.etcd = result;
    });

  ClusterSvc.controlServiceSummary()
    .then(function(result) {
      $scope.services = result;
      $scope.apiserver = _.findWhere($scope.services, { id: 'API Server' });
      $scope.controllerManager = _.findWhere($scope.services, { id: 'Controller Manager' });
      $scope.scheduler = _.findWhere($scope.services, { id: 'Scheduler' });
    });

});
