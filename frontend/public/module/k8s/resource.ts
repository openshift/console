import * as _ from 'lodash-es';
import { K8sResourceCommon, Selector } from '@console/dynamic-plugin-sdk/src';

import { coFetchJSON } from '../../co-fetch';
import { k8sBasePath } from './k8s';
import { K8sKind, Patch } from './types';
import { selectorToString } from './selector';
import { WSFactory } from '../ws-factory';

const getK8sAPIPath = ({ apiGroup = 'core', apiVersion }: K8sKind): string => {
  const isLegacy = apiGroup === 'core' && apiVersion === 'v1';
  let p = isLegacy ? '/api/' : '/apis/';

  if (!isLegacy && apiGroup) {
    p += `${apiGroup}/`;
  }

  p += apiVersion;
  return p;
};

type QueryParams = {
  watch?: string;
  labelSelector?: string;
  fieldSelector?: string;
  resourceVersion?: string;
  [key: string]: string;
};

export type Options = {
  ns?: string;
  name?: string;
  path?: string;
  queryParams?: QueryParams;
};

export const getK8sResourcePath = (model: K8sKind, options: Options): string => {
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
    const q = _.map(options.queryParams, function(v, k) {
      return `${k}=${v}`;
    });
    u += `?${q.join('&')}`;
  }

  return u;
};

export const resourceURL = (model: K8sKind, options: Options): string =>
  `${k8sBasePath}${getK8sResourcePath(model, options)}`;

export const watchURL = (kind: K8sKind, options: Options): string => {
  const opts = options || {};

  opts.queryParams = opts.queryParams || {};
  opts.queryParams.watch = 'true';
  return resourceURL(kind, opts);
};

export const k8sGet = (
  kind: K8sKind,
  name: string,
  ns?: string,
  opts?: Options,
  requestInit?: RequestInit,
) => coFetchJSON(resourceURL(kind, Object.assign({ ns, name }, opts)), 'GET', requestInit);

export const k8sCreate = <R extends K8sResourceCommon>(
  kind: K8sKind,
  data: R,
  opts: Options = {},
) => {
  return coFetchJSON.post(
    resourceURL(kind, Object.assign({ ns: data?.metadata?.namespace }, opts)),
    data,
  );
};

export const k8sUpdate = <R extends K8sResourceCommon>(
  kind: K8sKind,
  data: R,
  ns?: string,
  name?: string,
  opts?: Options,
): Promise<R> =>
  coFetchJSON.put(
    resourceURL(kind, {
      ns: ns || data.metadata.namespace,
      name: name || data.metadata.name,
      ...opts,
    }),
    data,
  );

export const k8sPatch = <R extends K8sResourceCommon>(
  kind: K8sKind,
  resource: R,
  data: Patch[],
  opts: Options = {},
) => {
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

export const k8sPatchByName = (
  kind: K8sKind,
  name: string,
  namespace: string,
  data: Patch[],
  opts: Options = {},
) => k8sPatch(kind, { metadata: { name, namespace } }, data, opts);

export const k8sKill = <R extends K8sResourceCommon>(
  kind: K8sKind,
  resource: R,
  opts: Options = {},
  requestInit: RequestInit = {},
  json: Object = null,
) =>
  coFetchJSON.delete(
    resourceURL(
      kind,
      Object.assign({ ns: resource.metadata.namespace, name: resource.metadata.name }, opts),
    ),
    requestInit,
    json,
  );

export const k8sKillByName = <R extends K8sResourceCommon>(
  kind: K8sKind,
  name: string,
  namespace?: string,
  opts: Options = {},
  requestInit: RequestInit = {},
): Promise<R> => k8sKill(kind, { metadata: { name, namespace } }, opts, requestInit);

export const k8sList = (
  kind: K8sKind,
  params: { [key: string]: any } = {},
  raw = false,
  requestInit: RequestInit = {},
) => {
  const query = _.map(_.omit(params, 'ns'), (v, k) => {
    if (k === 'labelSelector') {
      v = selectorToString(v);
    }
    return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
  }).join('&');

  const listURL = resourceURL(kind, { ns: params.ns });
  return coFetchJSON(`${listURL}?${query}`, 'GET', requestInit).then((result) => {
    const typedItems = result.items?.map((i) => ({
      kind: kind.kind,
      apiVersion: result.apiVersion,
      ...i,
    }));
    return raw ? { ...result, items: typedItems } : typedItems;
  });
};

export const k8sListPartialMetadata = (
  kind: K8sKind,
  params: { [key: string]: any } = {},
  raw = false,
) => {
  return k8sList(kind, params, raw, {
    headers: {
      Accept:
        'application/json;as=PartialObjectMetadataList;v=v1beta1;g=meta.k8s.io,application/json',
    },
  });
};

export const k8sWatch = (
  kind: K8sKind,
  query: {
    labelSelector?: Selector;
    resourceVersion?: string;
    ns?: string;
    fieldSelector?: string;
  } = {},
  wsOptions: {
    [key: string]: any;
  } = {},
) => {
  const queryParams: QueryParams = { watch: 'true' };
  const opts: {
    queryParams: QueryParams;
    ns?: string;
  } = { queryParams };
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

  const labelSelector = query.labelSelector;
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

/**
 * Use k8sWatch to wait for a resource to get into an expected condition.
 * Watches for resource by kind, namespace and optional name.
 * Promise resolves to a new resource version or rejects with a timeout.
 */
export const k8sWaitForUpdate = <R extends K8sResourceCommon>(
  kind: K8sKind,
  resource: R,
  checkCondition: (kind: R) => boolean,
  timeoutInMs: number,
) => {
  if (!resource || !resource.metadata) {
    return Promise.reject(new Error('Provided resource is undefined'));
  }
  const { namespace, name, resourceVersion } = resource.metadata;
  try {
    if (checkCondition(resource)) {
      return Promise.resolve(resource);
    }
  } catch (error) {
    return Promise.reject(error);
  }

  const watcher = k8sWatch(kind, {
    ns: namespace,
    resourceVersion,
  });
  const closeConnection = () => watcher.destroy();

  const waitForCondition = new Promise((resolve, reject) => {
    watcher.onbulkmessage((messages) => {
      for (const message of messages) {
        const { object } = message;
        if (!name || name === object?.metadata?.name) {
          try {
            if (checkCondition(object)) {
              resolve(object);
            }
          } catch (err) {
            reject(err);
          }
        }
      }
    });
    watcher.onclose(() => reject(new Error('Connection closed')));
    watcher.ondestroy(() => reject(new Error('Connection destroyed')));
  });

  const waitForTimeout = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Timed out waiting for resource to finish')), timeoutInMs);
  });

  return Promise.race([waitForCondition, waitForTimeout]).finally(closeConnection);
};
