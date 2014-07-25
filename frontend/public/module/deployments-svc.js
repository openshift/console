angular.module('app')
.factory('DeploymentsSvc', function($q, $http) {
  'use strict';

  var DeploymentsSvc = {},
      client;

  DeploymentsSvc.deployments = [];

  DeploymentsSvc.setClient = function(c) {
    client = c;
  };

  DeploymentsSvc.fetchAll = function() {
    return client.controllers.list()
      .then(function(result) {
        DeploymentsSvc.deployments = result.data.items;
        return result;
      });
  };

  return DeploymentsSvc;

});
