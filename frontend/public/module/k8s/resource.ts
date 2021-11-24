import { K8sResourceCommon, QueryParams, Selector } from '@console/dynamic-plugin-sdk/src';
import {
  k8sPatch,
  k8sKill,
  k8sList,
  resourceURL,
  selectorToString,
} from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { K8sKind, Patch } from './types';
import { WSFactory, WSOptions } from '../ws-factory';

export type Options = {
  ns?: string;
  name?: string;
  path?: string;
  queryParams?: QueryParams;
};

export const watchURL = (kind: K8sKind, options: Options): string => {
  const opts = options || {};

  opts.queryParams = opts.queryParams || {};
  opts.queryParams.watch = 'true';
  return resourceURL(kind, opts);
};

export const k8sPatchByName = (
  kind: K8sKind,
  name: string,
  namespace: string,
  data: Patch[],
  opts: Options = {},
) => k8sPatch(kind, { metadata: { name, namespace } }, data, opts);

export const k8sKillByName = <R extends K8sResourceCommon>(
  kind: K8sKind,
  name: string,
  namespace?: string,
  opts: Options = {},
  requestInit: RequestInit = {},
): Promise<R> => k8sKill(kind, { metadata: { name, namespace } }, opts, requestInit);

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
  return new WSFactory(path, wsOptions as WSOptions);
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
