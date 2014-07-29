angular.module('app')
.service('PodsSvc', function(_, $rootScope) {
  'use strict';

  this.list = function() {
    return $rootScope.client.pods.list()
      .then(function(result) {
        return result.data.items;
      });
  };

  this.get = function(args) {
    return $rootScope.client.pods.get(args)
      .then(function(result) {
        return result.data;
      });
  };

  this.find = function(list, id) {
    return _.findWhere(list, { id: id });
  };

});
