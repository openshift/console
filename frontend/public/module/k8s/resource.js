import {coFetchJSON} from '../../co-fetch';
import {getKubernetesAPIPath} from './k8s';
import {toString} from './selector';

angular.module('k8s')
.service('k8sResource', function(_) {
  'use strict';

  this.resourceURL = function(kind, options) {
    let q = '';
    let u = getKubernetesAPIPath(kind);

    if (options.ns) {
      u += `/namespaces/${options.ns}`;
    }
    u += `/${kind.path}`;
    if (options.name) {
      u += `/${options.name}`;
    }
    if (options.path) {
      u += `/${options.path}`;
    }
    if (!_.isEmpty(options.queryParams)) {
      q = _.map(options.queryParams, function(v, k) {
        return `${k}=${v}`;
      });
      u += `?${q.join('&')}`;
    }

    return u;
  };

  this.resourceURL2 = (kind, namespace, watch, labelSelector, fieldSelector) => {
    const opts = {queryParams: {}};

    if (labelSelector) {
      opts.queryParams.labelSelector = encodeURIComponent(toString(labelSelector));
    }

    if (fieldSelector) {
      opts.queryParams.fieldSelector = encodeURIComponent(fieldSelector);
    }

    if (watch) {
      opts.queryParams.watch = true;
    }

    if (namespace) {
      opts.ns = namespace;
    }

    return this.resourceURL(kind, opts);
  };

  this.watchURL = (kind, options) => {
    var opts = options || {};

    opts.queryParams = opts.queryParams || {};
    opts.queryParams.watch = true;
    return this.resourceURL(kind, opts);
  };

  this.get = (kind, name, ns, opts) => coFetchJSON(this.resourceURL(kind, Object.assign({ns, name}, opts)));

  this.list = (kind, params) => {
    let ns;
    if (params) {
      if (!_.isEmpty(params.labelSelector)) {
        params.labelSelector = toString(params.labelSelector);
      }
      if (params.ns) {
        ns = params.ns;
        delete params.ns;
      }
    }

    const query = _.map(params, (v, k) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    return coFetchJSON(`${this.resourceURL(kind, {ns})}?${query}`).then(result => result.items);
  };

  this.create = (kind, data) => {
    // Lowercase the resource name
    // https://github.com/kubernetes/kubernetes/blob/HEAD/docs/user-guide/identifiers.md#names
    data.metadata.name = data.metadata.name.toLowerCase();

    return coFetchJSON.post(this.resourceURL(kind, {ns: data.metadata.namespace}), data);
  };

  this.update = (kind, data, ns, name) => coFetchJSON.put(
    this.resourceURL(kind, {ns: ns || data.metadata.namespace, name: name || data.metadata.name}),
    data
  );

  this.patch = (kind, resource, data) => coFetchJSON.patch(
    this.resourceURL(kind, {ns: resource.metadata.namespace, name: resource.metadata.name}),
    data
  );

  this.delete = (kind, resource, opts) => coFetchJSON.delete(
    this.resourceURL(kind, Object.assign({ns: resource.metadata.namespace, name: resource.metadata.name}, opts))
  );
});
