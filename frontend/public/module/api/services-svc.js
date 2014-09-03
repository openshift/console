angular.module('app')
.service('ServicesSvc', function(_, $rootScope, EVENTS) {
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

  this.create = function(service) {
    return $rootScope.client.services.create(service);
  };

  this.delete = function(service) {
    var p = $rootScope.client.services.delete({ id: service.id });
    p.then(function() {
      // TODO: handle pending delete status.
      $rootScope.$broadcast(EVENTS.SERVICE_DELETE, service);
    });
    return p;
  };

});
