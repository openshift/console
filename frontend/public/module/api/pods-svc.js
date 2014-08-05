angular.module('app')
.service('PodsSvc', function(_, $rootScope, LabelSvc) {
  'use strict';

  this.list = function(params) {
    if (params && params.labels) {
      params.labels = LabelSvc.encode(params.labels);
    }
    return $rootScope.client.pods.list(params)
      .then(function(result) {
        return result.data.items;
      });
  };

  this.get = function(params) {
    return $rootScope.client.pods.get(params)
      .then(function(result) {
        return result.data;
      });
  };

  this.find = function(list, id) {
    return _.findWhere(list, { id: id });
  };

});
