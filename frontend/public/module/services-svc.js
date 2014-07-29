angular.module('app')
.service('ServicesSvc', function(_, $rootScope) {
  'use strict';

  this.list = function() {
    return $rootScope.client.services.list()
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
