import * as _ from 'lodash';
import { K8sModel } from '../../api/common-types';
import { Options } from '../../api/internal-types';
import { K8sResourceCommon, Patch, QueryParams } from '../../extensions/console-types';
import { consoleFetchJSON as coFetchJSON } from '../fetch';
import { selectorToString, resourceURL } from './k8s-utils';

type BaseOptions = {
  name?: string;
  ns?: string;
  path?: string;
  queryParams?: QueryParams;
};

type AdapterFunc = <D extends BaseOptions>(
  func: Function,
  knownArgs: string[],
) => (options: D) => Promise<Response>;

/**
 * An adapter function to call the underlying APIs with provided options.
 * @param func The function to be called.
 * @param knownArgs  The list of arguments to be provided to underlying API in order.
 * @return The function called with provided arguments.
 * * */
const adapterFunc: AdapterFunc = (func: Function, knownArgs: string[]) => {
  return (options) => {
    const args = knownArgs.map((arg) => {
      // forming opts to match underlying API signature if it's there in knownArgs
      if (arg === 'opts') {
        const { name, ns, path, queryParams } = options || {};
        return {
          ...(name && { name }),
          ...(ns && { ns }),
          ...(path && { path }),
          ...(queryParams && { queryParams }),
        };
      }
      return options[arg];
    });
    return func(...args);
  };
};

/**
 * @deprecated Use {@link k8sGetResource} instead. Support for k8sGet will be removed in a future release.
 * It fetches a resource from the cluster, based on the provided model, name, namespace.
 * If the name is provided it returns one resource else it returns all the resources matching the model.
 * @param model k8s model
 * @param name The name of the resource, if not provided then it'll look for all the resources matching the model.
 * @param ns The namespace to look into, should not be specified for cluster-scoped resources.
 * @param opts The options to pass
 * @param requestInit The fetch init object to use. This can have request headers, method, redirect, etc.
 * See more {@link https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html}
 * @return A promise that resolves to the response as JSON object with a resource if the name is provided
 * else it returns all the resouces matching the model. In case of failure, the promise gets rejected with HTTP error response.
 * * */
export const k8sGet = (
  model: K8sModel,
  name: string,
  ns?: string,
  opts?: Options,
  requestInit?: RequestInit,
) => coFetchJSON(resourceURL(model, Object.assign({ ns, name }, opts)), 'GET', requestInit);

type OptionsGet = BaseOptions & {
  model: K8sModel;
  requestInit?: RequestInit;
};

type K8sGetResource = (options: OptionsGet) => Promise<Response>;

/**
 * It fetches a resource from the cluster, based on the provided options.
 * If the name is provided it returns one resource else it returns all the resources matching the model.
 * @param options Which are passed as key-value pairs in the map
 * @param options.model k8s model
 * @param options.name The name of the resource, if not provided then it'll look for all the resources matching the model.
 * @param options.ns The namespace to look into, should not be specified for cluster-scoped resources.
 * @param options.path Appends as subpath if provided
 * @param options.queryParams The query parameters to be included in the URL.
 * @param options.requestInit The fetch init object to use. This can have request headers, method, redirect, etc.
 * See more {@link https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html}
 * @return A promise that resolves to the response as JSON object with a resource if the name is provided
 * else it returns all the resources matching the model. In case of failure, the promise gets rejected with HTTP error response.
 * * */
export const k8sGetResource: K8sGetResource = adapterFunc(k8sGet, [
  'model',
  'name',
  'ns',
  'opts',
  'requestInit',
]);

/**
 * @deprecated Use {@link k8sCreateResource} instead. Support for k8sCreate will be removed in a future release.
 * It creates a resource in the cluster, based on the provided model and payload.
 * @param model k8s model
 * @param data The payload for the resource to be created.
 * @param opts The options to pass.
 * @return A promise that resolves to the response of the resource created.
 * In case of failure promise gets rejected with HTTP error response.
 * * */
export const k8sCreate = <R extends K8sResourceCommon>(
  model: K8sModel,
  data: R,
  opts: Options = {},
) => {
  return coFetchJSON.post(
    resourceURL(model, Object.assign({ ns: data?.metadata?.namespace }, opts)),
    data,
  );
};

type OptionsCreate<R> = BaseOptions & {
  model: K8sModel;
  data: R;
};

type K8sCreateResource = <R extends K8sResourceCommon>(
  options: OptionsCreate<R>,
) => Promise<Response>;

/**
 * It creates a resource in the cluster, based on the provided options.
 * @param options Which are passed as key-value pairs in the map
 * @param options.model k8s model
 * @param options.data payload for the resource to be created
 * @param options.path Appends as subpath if provided
 * @param options.queryParams The query parameters to be included in the URL.
 * @return A promise that resolves to the response of the resource created.
 * In case of failure promise gets rejected with HTTP error response.
 * * */
export const k8sCreateResource: K8sCreateResource = adapterFunc(k8sCreate, [
  'model',
  'data',
  'opts',
]);

/**
 * @deprecated Use {@link k8sUpdateResource} instead. Support for k8sUpdate will be removed in a future release.
 * It updates the entire resource in the cluster, based on the provided model, data, name, namespace.
 * When a client needs to replace an existing resource entirely, they can use k8sUpdate.
 * Alternatively can use k8sPatch to perform the partial update.
 * @param model k8s model
 * @param data payload for the resource to be updated.
 * @param ns namespace to look into, it should not be specified for cluster-scoped resources.
 * @param name resource name to be updated.
 * @param opts The options to pass
 * @return A promise that resolves to the response of the resource updated.
 * In case of failure promise gets rejected with HTTP error response.
 * * */
export const k8sUpdate = <R extends K8sResourceCommon>(
  model: K8sModel,
  data: R,
  ns?: string,
  name?: string,
  opts?: Options,
): Promise<R> =>
  coFetchJSON.put(
    resourceURL(model, {
      ns: ns || data.metadata?.namespace,
      name: name || data.metadata?.name,
      ...opts,
    }),
    data,
  );

type OptionsUpdate<R> = BaseOptions & {
  model: K8sModel;
  data: R;
};

type K8sUpdateResource = <R extends K8sResourceCommon>(
  options: OptionsUpdate<R>,
) => Promise<Response>;
/**
 * It updates the entire resource in the cluster, based on provided options.
 * When a client needs to replace an existing resource entirely, they can use k8sUpdate.
 * Alternatively can use k8sPatch to perform the partial update.
 * @param options which are passed as key-value pair in the map
 * @param options.model k8s model
 * @param options.data payload for the k8s resource to be updated
 * @param options.ns namespace to look into, it should not be specified for cluster-scoped resources.
 * @param options.name resource name to be updated.
 * @param options.path Appends as subpath if provided
 * @param options.queryParams The query parameters to be included in the URL.
 * @return A promise that resolves to the response of the resource updated.
 * In case of failure promise gets rejected with HTTP error response.
 * * */
export const k8sUpdateResource: K8sUpdateResource = adapterFunc(k8sUpdate, [
  'model',
  'data',
  'ns',
  'name',
  'opts',
]);

/**
 * @deprecated Use {@link k8sPatchResource} instead. Support for k8sPatch will be removed in a future release.
 * It patches any resource in the cluster, based on provided model, resource, data.
 * When a client needs to perform the partial update, they can use k8sPatch.
 * Alternatively can use k8sUpdate to replace an existing resource entirely.
 * See more {@link https://datatracker.ietf.org/doc/html/rfc6902}
 * @param model k8s model
 * @param resource The resource to be patched
 * @param data Only the data to be patched on existing resource with the operation, path, and value
 * @param opts The options to pass
 * @return A promise that resolves to the response of the resource patched.
 * In case of failure promise gets rejected with HTTP error response.
 * * */
export const k8sPatch = <R extends K8sResourceCommon>(
  model: K8sModel,
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
      model,
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

type OptionsPatch<R> = BaseOptions & {
  model: K8sModel;
  resource: R;
  data: Patch[];
};

type K8sPatchResource = <R extends K8sResourceCommon>(
  options: OptionsPatch<R>,
) => Promise<Response>;

/**
 * It patches any resource in the cluster, based on provided options.
 * When a client needs to perform the partial update, they can use k8sPatch.
 * Alternatively can use k8sUpdate to replace an existing resource entirely.
 * See more {@link https://datatracker.ietf.org/doc/html/rfc6902}
 * @param options Which are passed as key-value pairs in the map.
 * @param options.model k8s model
 * @param options.resource The resource to be patched.
 * @param options.data Only the data to be patched on existing resource with the operation, path, and value.
 * @param options.path Appends as subpath if provided.
 * @param options.queryParams The query parameters to be included in the URL.
 * @return A promise that resolves to the response of the resource patched.
 * In case of failure promise gets rejected with HTTP error response.
 * * */
export const k8sPatchResource: K8sPatchResource = adapterFunc(k8sPatch, [
  'model',
  'resource',
  'data',
  'opts',
]);

/**
 * @deprecated Use {@link k8sDeleteResource} instead. Support for k8sKill will be removed in a future release.
 * It deletes resources from the cluster, based on the provided model, resource.
 * The garbage collection works based on 'Foreground' | 'Background', can be configured with propagationPolicy property in provided model or passed in json.
 * See more {@link https://kubernetes.io/docs/concepts/architecture/garbage-collection/}
 * @param model k8s model
 * @param resource The resource to be deleted.
 * @param opts The Options to pass
 * @param requestInit The fetch init object to use. This can have request headers, method, redirect, etc.
 * See more {@link https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html}
 * @param options.json Can control garbage collection of resource explicitly if provided else will default to model's "propagationPolicy".
 * @example
 * { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy }
 * @return A promise that resolves to the response of kind Status.
 * In case of failure promise gets rejected with HTTP error response.
 * * */
export const k8sKill = <R extends K8sResourceCommon>(
  model: K8sModel,
  resource: R,
  opts: Options = {},
  requestInit: RequestInit = {},
  json: Record<string, any> = null,
) => {
  const { propagationPolicy } = model;
  const jsonData =
    json ?? (propagationPolicy && { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy });
  return coFetchJSON.delete(
    resourceURL(
      model,
      Object.assign({ ns: resource.metadata.namespace, name: resource.metadata.name }, opts),
    ),
    jsonData,
    requestInit,
  );
};

type OptionsDelete<R> = BaseOptions & {
  model: K8sModel;
  resource: R;
  requestInit: RequestInit;
  json: Record<string, any>;
};

type K8sDeleteResource = <R extends K8sResourceCommon>(
  options: OptionsDelete<R>,
) => Promise<Response>;

/**
 * It deletes resources from the cluster, based on the provided model, resource.
 * The garbage collection works based on 'Foreground' | 'Background', can be configured with propagationPolicy property in provided model or passed in json.
 * @param options which are passed as key-value pair in the map.
 * @param options.model k8s model
 * @param options.resource The resource to be deleted.
 * @param options.path Appends as subpath if provided
 * @param options.queryParams The query parameters to be included in the URL.
 * @param options.requestInit The fetch init object to use. This can have request headers, method, redirect, etc.
 * See more {@link https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html}
 * @param options.json Can control garbage collection of resources explicitly if provided else will default to model's "propagationPolicy".
 * @example
 * { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy }
 * @return A promise that resolves to the response of kind Status.
 * In case of failure promise gets rejected with HTTP error response.
 * * */
export const k8sDeleteResource: K8sDeleteResource = adapterFunc(k8sKill, [
  'model',
  'resource',
  'opts',
  'requestInit',
  'json',
]);

/**
 * @deprecated Use {@link k8sListResource} instead. Support for k8sList will be removed in a future release.
 * It lists the resources as an array in the cluster, based on the provided model, queryParams(label selector).
 * @param model k8s model
 * @param queryParams The query parameters to be included in the URL and can pass label selector's as well with key "labelSelector".
 * @param raw If true then returns raw data i.e if the query is for Pod then resolved resources will not be in an array but a resource will be returned of kind PodList
 * and it will have a key "item" which will be an array of Pod kind.
 * @param requestInit The fetch init object to use. This can have request headers, method, redirect, etc.
 * See more {@link https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html}
 * @return A promise that resolves to the response with the resources in an array.
 * In case of failure promise gets rejected with HTTP error response.
 * * */
export const k8sList = (
  model: K8sModel,
  queryParams: { [key: string]: any } = {},
  raw = false,
  requestInit: RequestInit = {},
) => {
  const query = _.map(_.omit(queryParams, 'ns'), (v, k) => {
    let newVal;
    if (k === 'labelSelector') {
      newVal = selectorToString(v);
    }
    return `${encodeURIComponent(k)}=${encodeURIComponent(newVal ?? v)}`;
  }).join('&');

  const listURL = resourceURL(model, { ns: queryParams.ns });
  return coFetchJSON(`${listURL}?${query}`, 'GET', requestInit).then((result) => {
    const typedItems = result.items?.map((i) => ({
      kind: model.kind,
      apiVersion: result.apiVersion,
      ...i,
    }));
    return raw ? { ...result, items: typedItems } : typedItems;
  });
};

type OptionsList = {
  model: K8sModel;
  queryParams: { [key: string]: any };
  requestInit: RequestInit;
};

type K8sListResource = (options: OptionsList) => Promise<Response>;

/**
 * It lists the resources as an array in the cluster, based on provided options.
 * @param options Which are passed as key-value pairs in the map
 * @param options.model k8s model
 * @param options.queryParams The query parameters to be included in the URL and can pass label selector's as well with key "labelSelector".
 * @param options.requestInit The fetch init object to use. This can have request headers, method, redirect, etc.
 * See more {@link https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html}
 * @return A promise that resolves to the response
 * * */
export const k8sListResource: K8sListResource = adapterFunc(k8sList, [
  'model',
  'queryParams',
  'raw',
  'requestInit',
]);
