angular.module('app')
.service('ServicesSvc', function(_, $rootScope, EVENTS, LabelSvc) {
  'use strict';

  this.get = $rootScope.client.services.get;

  this.list = function(params) {
    if (params && params.labels) {
      params.labels = LabelSvc.urlEncode(params.labels);
    }
    return $rootScope.client.services.list(params);
  };

  this.create = function(service) {
    if (_.isEmpty(service.labels)) {
      service.labels = null;
    }
    return $rootScope.client.services.create(service);
  };

  this.delete = function(service) {
    var p = $rootScope.client.services.delete({ id: service.id });
    p.then(function() {
      // TODO: handle pending delete status.
      // TOOD: intercept these in a general way.
      $rootScope.$broadcast(EVENTS.SERVICE_DELETE, service);
    });
    return p;
  };

  this.find = function(list, id) {
    return _.findWhere(list, { id: id });
  };

});
