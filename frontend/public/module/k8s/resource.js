// TODO(sym3tri): pass scope to config instead of using rootScope?

angular.module('k8s')
.service('k8sResource', function($q, $rootScope, $http, _, k8sConfig, k8sLabels, k8sEvents) {
  'use strict';

  var basePath = k8sConfig.getBasePath();

  this.resourceURL = function(kind, options) {
    var u = basePath,
        q,
        queryParams = _.omit(options, 'name', 'ns');

    if (options.ns) {
      u += '/namespaces/' + options.ns;
    }
    u += '/' + kind.path;
    if (options.name) {
      u += '/' + options.name;
    }

    // turn all other options into query params
    q = _.map(queryParams, function(v, k) {
      return k + '=' + v;
    });
    if (q.length) {
      u += '?' + q.join('&');
    }

    return u;
  };

  this.watchURL = function(kind, options) {
    var opts = options || {};
    opts.watch = true;
    return this.resourceURL(kind, opts);
  }.bind(this);

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
