import { K8sResourceCommon, QueryParams } from '@console/dynamic-plugin-sdk/src';
import {
  k8sPatch,
  k8sKill,
  k8sList,
  resourceURL,
  k8sWatch,
} from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { K8sKind, Patch } from './types';

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
