angular.module('app')
.controller('DeploymentsCtrl', function($scope, client, DeploymentsSvc) {
  'use strict';

  $scope.client = client;

  DeploymentsSvc.setClient(client);

  DeploymentsSvc.fetchAll().then(function() {
    $scope.deployments = DeploymentsSvc.deployments;
  });

});
