angular.module('app')
.service('ControllersSvc', function($rootScope) {
  'use strict';

  this.list = function(params) {
    return $rootScope.client.replicationControllers.list(params)
      .then(function(result) {
        return result.data.items;
      });
  };

  this.find = function(list, id) {
    return _.findWhere(list, { id: id });
  };

});
