// TODO(sym3tri): pass scope to config instead of using rootScope?

angular.module('k8s')
.service('k8sResource', function($q, $rootScope, $http, _, k8sConfig, k8sSelector, k8sEvents) {
  'use strict';

  this.resourceURL = function(kind, options) {
    var q = '',
        u = k8sConfig.getKubernetesAPIPath(kind);

    if (options.ns) {
      u += '/namespaces/' + options.ns;
    }
    u += '/' + kind.path;
    if (options.name) {
      u += '/' + options.name;
    }
    if (options.path) {
      u += '/' + options.path;
    }
    if (!_.isEmpty(options.queryParams)) {
      q = _.map(options.queryParams, function(v, k) {
        return k + '=' + v;
      });
      u += '?' + q.join('&');
    }

    return u;
  };

  this.watchURL = function(kind, options) {
    var opts = options || {};
    opts.queryParams = opts.queryParams || {};
    opts.queryParams.watch = true;
    return this.resourceURL(kind, opts);
  }.bind(this);

  this.list = function(kind, params) {
    var ns, d = $q.defer();
    if (params) {
      if (!_.isEmpty(params.labelSelector)) {
        params.labelSelector = k8sSelector.stringify(params.labelSelector);
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
    // Lowercase the resource name
    // https://github.com/kubernetes/kubernetes/blob/HEAD/docs/user-guide/identifiers.md#names
    data.metadata.name = data.metadata.name.toLowerCase();
    $http({
      url: this.resourceURL(kind, {ns: data.metadata.namespace}),
      method: 'POST',
      data: data,
    })
    .then(function(result) {
      $rootScope.$broadcast(k8sEvents.RESOURCE_ADDED, {
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
    $http({
      url: this.resourceURL(kind, {ns: data.metadata.namespace, name: data.metadata.name}),
      method: 'PUT',
      data: data,
    })
    .then(function(result) {
      $rootScope.$broadcast(k8sEvents.RESOURCE_MODIFIED, {
        kind: kind,
        original: data,
        resource: result.data,
      });
      d.resolve(result.data);
    })
    .catch(d.reject);

    return d.promise;
  }.bind(this);

  this.patch = function(kind, resource, payload) {
    var d = $q.defer();
    $http({
      headers: {
        'Content-Type': 'application/json-patch+json',
      },
      url: this.resourceURL(kind, {ns: resource.metadata.namespace, name: resource.metadata.name}),
      method: 'PATCH',
      data: payload,
    })
    .then(function(result) {
      $rootScope.$broadcast(k8sEvents.RESOURCE_MODIFIED, {
        kind: kind,
        original: resource,
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
