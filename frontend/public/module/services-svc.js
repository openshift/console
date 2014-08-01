angular.module('app')
.service('ServicesSvc', function(_, $rootScope) {
  'use strict';

  this.list = function(params) {
    return $rootScope.client.services.list(params)
      .then(function(result) {
        return result.data.items;
      });
  };

  this.get = function(args) {
    return $rootScope.client.services.get(args)
      .then(function(result) {
        return result.data;
      });
  };

  this.find = function(list, id) {
    return _.findWhere(list, { id: id });
  };

});
