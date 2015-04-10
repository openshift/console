// TODO(sym3tri): pass scope to config instead of using rootScope?

angular.module('k8s')
.service('k8sResource', function($q, $rootScope, $http, _, k8sConfig, k8sLabels, k8sEvents) {
  'use strict';

  var basePath = k8sConfig.getBasePath();

  this.resourceURL = function(kind, options) {
    var u = basePath;
    if (options.ns) {
      u += '/namespaces/' + options.ns;
    }
    u += '/' + kind.path;
    if (options.name) {
      u += '/' + options.name;
    }
    return u;
  };

  this.list = function(kind, params) {
    var ns, d = $q.defer();
    if (params) {
      if (!_.isEmpty(params.labelSelector)) {
        params.labelSelector = k8sLabels.urlEncode(params.labelSelector);
      }
      if (params.ns) {
        ns = params.ns;
        delete params.ns;
      }
    }

    $http({
      url: this.resourceURL(kind, {ns: ns}),
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
      url: this.resourceURL(kind, {ns: data.metadata.namespace}),
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
      url: this.resourceURL(kind, {ns: data.metadata.namespace, name: data.metadata.name}),
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

  this.get = function(kind, name, ns) {
    var d = $q.defer();
    $http({
      url: this.resourceURL(kind, {ns: ns, name: name}),
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
      url: this.resourceURL(kind, {ns: resource.metadata.namespace, name: resource.metadata.name}),
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
