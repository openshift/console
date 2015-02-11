// TODO(sym3tri): pass scope to config instead of using rootScope?

angular.module('k8s')
.service('k8sResource', function($q, $rootScope, $http, k8sConfig, k8sLabels, k8sEvents) {
  'use strict';

  var basePath = k8sConfig.getBasePath();

  this.resourceURL = function(kind, name) {
    var u = basePath + '/' + kind.path;
    if (name) {
      u += '/' + name;
    }
    return u;
  }.bind(this);

  this.list = function(kind, params) {
    var d = $q.defer();
    if (params && params.labels) {
      params.labels = k8sLabels.urlEncode(params.labels);
    }

    $http({
      url: this.resourceURL(kind),
      method: 'GET',
      params: params,
    })
    .then(function(result) {
      d.resolve(result.data.items);
    })
    .catch(d.reject);

    return d.promise;
  }.bind(this);

  this.create = function(kind, data) {
    var d = $q.defer();
    // TODO: handle pending create status.
    $http({
      url: this.resourceURL(kind),
      method: 'POST',
      data: data,
    })
    .then(function(result) {
      $rootScope.$broadcast(k8sEvents.RESOURCE_CREATED, {
        kind: kind,
        original: data,
        resource: result.data,
      });
      d.resolve(result.data);
    })
    .catch(d.reject);

    return d.promise;
  }.bind(this);

  this.update = function(kind, data) {
    var d = $q.defer();
    // TODO: handle pending update status.
    $http({
      url: this.resourceURL(kind, data.metadata.name),
      method: 'PUT',
      data: data,
    })
    .then(function(result) {
      $rootScope.$broadcast(k8sEvents.RESOURCE_UPDATED, {
        kind: kind,
        original: data,
        resource: result.data,
      });
      d.resolve(result.data);
    })
    .catch(d.reject);

    return d.promise;
  }.bind(this);

  this.get = function(kind, name) {
    var d = $q.defer();
    $http({
      url: this.resourceURL(kind, name),
      method: 'GET',
    })
    .then(function(result) {
      d.resolve(result.data);
    })
    .catch(d.reject);

    return d.promise;
  }.bind(this);

  this.delete = function(kind, resource) {
    var p = $http({
      url: this.resourceURL(kind, resource.metadata.name),
      method: 'DELETE',
    });

    // TODO: handle pending delete status.
    p.then(function() {
      $rootScope.$broadcast(k8sEvents.RESOURCE_DELETED, {
        kind: kind,
        original: resource,
        resource: resource,
      });
    });

    return p;
  }.bind(this);

});
