import * as _ from 'lodash-es';
import { coFetchJSON } from '../../co-fetch';
import { k8sBasePath } from './k8s';
import { selectorToString } from './selector';
import { WSFactory } from '../ws-factory';

/** @type {(model: K8sKind) => string} */
const getK8sAPIPath = ({ apiGroup = 'core', apiVersion }) => {
  const isLegacy = apiGroup === 'core' && apiVersion === 'v1';
  let p = isLegacy ? '/api/' : '/apis/';

  if (!isLegacy && apiGroup) {
    p += `${apiGroup}/`;
  }

  p += apiVersion;
  return p;
};

/** @type {(model: GroupVersionKind, options: {ns?: string, name?: string, path?: string, queryParams?: {[k: string]: string}}) => string} */
export const getK8sResourcePath = (model, options) => {
  let q = '';
  let u = getK8sAPIPath(model);

  if (options.ns) {
    u += `/namespaces/${options.ns}`;
  }
  u += `/${model.plural}`;
  if (options.name) {
    // Some resources like Users can have special characters in the name.
    u += `/${encodeURIComponent(options.name)}`;
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

/** @type {(model: GroupVersionKind, options: {ns?: string, name?: string, path?: string, queryParams?: {[k: string]: string}}) => string} */
export const resourceURL = (model, options) =>
  `${k8sBasePath}${getK8sResourcePath(model, options)}`;

export const watchURL = (kind, options) => {
  const opts = options || {};

  opts.queryParams = opts.queryParams || {};
  opts.queryParams.watch = true;
  return resourceURL(kind, opts);
};

export const k8sGet = (kind, name, ns, opts) =>
  coFetchJSON(resourceURL(kind, Object.assign({ ns, name }, opts)));

export const k8sCreate = (kind, data, opts = {}) => {
  // Occassionally, a resource won't have a metadata property.
  // For example: apps.openshift.io/v1 DeploymentRequest
  // https://github.com/openshift/api/blob/master/apps/v1/types.go
  data.metadata = data.metadata || {};

  // Lowercase the resource name
  // https://github.com/kubernetes/kubernetes/blob/HEAD/docs/user-guide/identifiers.md#names
  if (data.metadata.name && _.isString(data.metadata.name) && !data.metadata.generateName) {
    data.metadata.name = data.metadata.name.toLowerCase();
  }


  return coFetchJSON.post(
    resourceURL(kind, Object.assign({ ns: data.metadata.namespace }, opts)),
    data,
  );
};

export const devfileCreate = (kind, data, opts = {}) => {
  console.log("********************Huzzah it works!***********************")
  data.metadata = data.metadata || {};
  data.metadata.namespace = data.metadata.namespace || "default";


  let isMock = true;

  if(isMock) {

    //build obj here, return 
    const buildResourceObj = {
      apiVersion: 'build.openshift.io/v1',
      kind: 'BuildConfig',
      buildStrategy: 'Dockerfile',
      dockerStrategy : {
        dockerfileLocation : "abc"
      }
    }

    return buildResourceObj;
  }
  
  // let temp = coFetchJSON.post(resourceURL(kind, Object.assign({ ns: data.metadata.namespace }, opts)),
  //   data,);
  // return temp;
  // return coFetchJSON.post(
  //   resourceURL(kind, Object.assign({ ns: data.metadata.namespace }, opts)),
  //   data,
  // );
};

export const k8sUpdate = (kind, data, ns, name, opts) =>
  coFetchJSON.put(
    resourceURL(kind, {
      ns: ns || data.metadata.namespace,
      name: name || data.metadata.name,
      ...opts,
    }),
    data,
  );

export const k8sPatch = (kind, resource, data, opts = {}) => {
  const patches = _.compact(data);

  if (_.isEmpty(patches)) {
    return Promise.resolve(resource);
  }

  return coFetchJSON.patch(
    resourceURL(
      kind,
      Object.assign(
        {
          ns: resource.metadata.namespace,
          name: resource.metadata.name,
        },
        opts,
      ),
    ),
    patches,
  );
};

export const k8sPatchByName = (kind, name, namespace, data, opts = {}) =>
  k8sPatch(kind, { metadata: { name, namespace } }, data, opts);

export const k8sKill = (kind, resource, opts = {}, json = null) =>
  coFetchJSON.delete(
    resourceURL(
      kind,
      Object.assign({ ns: resource.metadata.namespace, name: resource.metadata.name }, opts),
    ),
    opts,
    json,
  );

export const k8sKillByName = (kind, name, namespace, opts = {}) =>
  k8sKill(kind, { metadata: { name, namespace } }, opts);

export const k8sList = (kind, params = {}, raw = false, options = {}) => {
  const query = _.map(_.omit(params, 'ns'), (v, k) => {
    if (k === 'labelSelector') {
      v = selectorToString(v);
    }
    return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
  }).join('&');

  const listURL = resourceURL(kind, { ns: params.ns });
  return coFetchJSON(`${listURL}?${query}`, 'GET', options).then((result) => {
    const typedItems = result.items?.map((i) => ({
      kind: kind.kind,
      apiVersion: result.apiVersion,
      ...i,
    }));
    return raw ? { ...result, items: typedItems } : typedItems;
  });
};

export const k8sListPartialMetadata = (kind, params = {}, raw = false) => {
  return k8sList(kind, params, raw, {
    headers: {
      Accept:
        'application/json;as=PartialObjectMetadataList;v=v1beta1;g=meta.k8s.io,application/json',
    },
  });
};

export const k8sWatch = (kind, query = {}, wsOptions = {}) => {
  const queryParams = { watch: true };
  const opts = { queryParams };
  wsOptions = Object.assign(
    {
      host: 'auto',
      reconnect: true,
      jsonParse: true,
      bufferFlushInterval: 500,
      bufferMax: 1000,
    },
    wsOptions,
  );

  const labelSelector = query.labelSelector || kind.labelSelector;
  if (labelSelector) {
    const encodedSelector = encodeURIComponent(selectorToString(labelSelector));
    if (encodedSelector) {
      queryParams.labelSelector = encodedSelector;
    }
  }

  if (query.fieldSelector) {
    queryParams.fieldSelector = encodeURIComponent(query.fieldSelector);
  }

  if (query.ns) {
    opts.ns = query.ns;
  }

  if (query.resourceVersion) {
    queryParams.resourceVersion = encodeURIComponent(query.resourceVersion);
  }

  const path = resourceURL(kind, opts);
  wsOptions.path = path;
  return new WSFactory(path, wsOptions);
};
