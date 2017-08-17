import {coFetchJSON} from '../../co-fetch';
import {getK8sAPIPath} from './k8s';
import {toString} from './selector';

export const resourceURL = (kind, options) => {
  let q = '';
  let u = getK8sAPIPath(kind);

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

export const resourceURL2 = (kind, namespace, watch, labelSelector, fieldSelector) => {
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

  return resourceURL(kind, opts);
};

export const watchURL = (kind, options) => {
  const opts = options || {};

  opts.queryParams = opts.queryParams || {};
  opts.queryParams.watch = true;
  return resourceURL(kind, opts);
};

export const k8sGet = (kind, name, ns, opts) => coFetchJSON(resourceURL(kind, Object.assign({ns, name}, opts)));

export const k8sCreate = (kind, data) => {
  // Lowercase the resource name
  // https://github.com/kubernetes/kubernetes/blob/HEAD/docs/user-guide/identifiers.md#names
  data.metadata.name = data.metadata.name.toLowerCase();

  return coFetchJSON.post(resourceURL(kind, {ns: data.metadata.namespace}), data);
};

export const k8sUpdate = (kind, data, ns, name) => coFetchJSON.put(
  resourceURL(kind, {ns: ns || data.metadata.namespace, name: name || data.metadata.name}),
  data
);

export const k8sPatch = (kind, resource, data) => coFetchJSON.patch(
  resourceURL(kind, {ns: resource.metadata.namespace, name: resource.metadata.name}),
  data
);

export const k8sKill = (kind, resource, opts) => coFetchJSON.delete(
  resourceURL(kind, Object.assign({ns: resource.metadata.namespace, name: resource.metadata.name}, opts))
);
