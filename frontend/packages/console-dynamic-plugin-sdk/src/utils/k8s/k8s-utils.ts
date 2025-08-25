import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';
import {
  K8sModel,
  MatchExpression,
  MatchLabels,
  ModelDefinition,
  Selector,
} from '../../api/common-types';
import { Options } from '../../api/internal-types';
import { QueryParams, K8sResourceKindReference } from '../../extensions/console-types';
import { Extension } from '../../types';
import { k8sBasePath } from './k8s';
import { getReferenceForModel } from './k8s-ref';
import { WSFactory, WSOptions } from './ws-factory';
// eslint-disable-next-line
const staticModels = require('@console/internal/models');

const getK8sAPIPath = ({ apiGroup = 'core', apiVersion }: K8sModel): string => {
  const isLegacy = apiGroup === 'core' && apiVersion === 'v1';
  let p = isLegacy ? '/api/' : '/apis/';

  if (!isLegacy && apiGroup) {
    p += `${apiGroup}/`;
  }

  p += apiVersion;
  return p;
};

/**
 * Constructs the Kubernetes API path for a specific resource type and options.
 *
 * This function builds the proper API path format for Kubernetes resources,
 * handling both core and custom API groups, namespacing, and query parameters.
 *
 * **Common use cases:**
 * - Building API URLs for resource CRUD operations
 * - Constructing WebSocket watch URLs
 * - Creating custom API request paths
 *
 * **Path format:**
 * - Core resources (v1): `/api/v1/[namespaces/{ns}/]{plural}[/{name}][/{path}][?query]`
 * - Extended resources: `/apis/{group}/{version}/[namespaces/{ns}/]{plural}[/{name}][/{path}][?query]`
 *
 * **Edge cases:**
 * - Automatically URL-encodes resource names with special characters
 * - Handles cluster-scoped resources by omitting namespace path
 * - Supports subresources via the path option
 * - Query parameters are properly formatted and encoded
 *
 * @example
 * ```tsx
 * // Core resource list
 * const path = getK8sResourcePath(
 *   {kind: 'Pod', apiVersion: 'v1', plural: 'pods', namespaced: true},
 *   {ns: 'default'}
 * );
 * // Returns: "/api/v1/namespaces/default/pods"
 * ```
 *
 * @example
 * ```tsx
 * // Specific resource with subresource
 * const path = getK8sResourcePath(
 *   {kind: 'Pod', apiVersion: 'v1', plural: 'pods', namespaced: true},
 *   {ns: 'default', name: 'my-pod', path: 'log'}
 * );
 * // Returns: "/api/v1/namespaces/default/pods/my-pod/log"
 * ```
 *
 * @example
 * ```tsx
 * // Custom resource with query parameters
 * const path = getK8sResourcePath(
 *   {kind: 'MyResource', apiGroup: 'example.com', apiVersion: 'v1', plural: 'myresources'},
 *   {queryParams: {labelSelector: 'app=test', limit: '10'}}
 * );
 * // Returns: "/apis/example.com/v1/myresources?labelSelector=app%3Dtest&limit=10"
 * ```
 *
 * @param model K8sModel containing resource type information (kind, apiGroup, apiVersion, etc.)
 * @param options Options object containing namespace, name, path, and query parameters
 * @returns Properly formatted Kubernetes API path string
 */
export const getK8sResourcePath = (model: K8sModel, options: Options): string => {
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
    const q = _.map(options.queryParams, (v, k) => {
      return `${k}=${v}`;
    });
    u += `?${q.join('&')}`;
  }

  return u;
};

/**
 * Constructs the complete URL for a Kubernetes resource API request through the Console proxy.
 *
 * This function combines the Console's k8s base path with the resource-specific path
 * to create a full URL suitable for making API requests.
 *
 * **Common use cases:**
 * - Making direct fetch requests to Kubernetes API
 * - Building WebSocket URLs for resource watching
 * - Constructing URLs for custom resource operations
 *
 * **URL format:**
 * - Complete URL: `{consolePath}/api/kubernetes{resourcePath}`
 * - Goes through Console proxy which handles authentication and RBAC
 *
 * @example
 * ```tsx
 * // Get complete URL for Pod list
 * const url = resourceURL(
 *   {kind: 'Pod', apiVersion: 'v1', plural: 'pods', namespaced: true},
 *   {ns: 'default'}
 * );
 * // Returns: "/api/kubernetes/api/v1/namespaces/default/pods"
 *
 * // Use with fetch
 * const response = await fetch(url);
 * const pods = await response.json();
 * ```
 *
 * @param model K8sModel containing resource type information
 * @param options Options object containing namespace, name, path, and query parameters
 * @returns Complete URL string ready for API requests
 */
export const resourceURL = (model: K8sModel, options: Options): string =>
  `${k8sBasePath}${getK8sResourcePath(model, options)}`;

const toArray = (value) => (Array.isArray(value) ? value : [value]);

/**
 * Converts a Kubernetes MatchExpression to its string representation.
 *
 * This function transforms Kubernetes label selector expressions into the string format
 * used in API queries and kubectl commands.
 *
 * **Supported operators:**
 * - `Equals`: `key=value`
 * - `NotEquals`: `key!=value`
 * - `Exists`: `key`
 * - `DoesNotExist`: `!key`
 * - `In`: `key in (value1,value2)`
 * - `NotIn`: `key notin (value1,value2)`
 * - `GreaterThan`: `key > value`
 * - `LessThan`: `key < value`
 *
 * **Common use cases:**
 * - Building label selectors for API queries
 * - Converting selectors for display in UI
 * - Constructing kubectl-compatible selector strings
 *
 * @example
 * ```tsx
 * // Equality check
 * const expr = {key: 'app', operator: 'Equals', values: ['frontend']};
 * const selector = requirementToString(expr);
 * // Returns: "app=frontend"
 * ```
 *
 * @example
 * ```tsx
 * // Set membership check
 * const expr = {key: 'environment', operator: 'In', values: ['staging', 'production']};
 * const selector = requirementToString(expr);
 * // Returns: "environment in (staging,production)"
 * ```
 *
 * @param requirement MatchExpression object with key, operator, and values
 * @returns String representation of the selector expression
 */
export const requirementToString = (requirement: MatchExpression): string => {
  if (requirement.operator === 'Equals') {
    return `${requirement.key}=${requirement.values[0]}`;
  }

  if (requirement.operator === 'NotEquals') {
    return `${requirement.key}!=${requirement.values[0]}`;
  }

  if (requirement.operator === 'Exists') {
    return requirement.key;
  }

  if (requirement.operator === 'DoesNotExist') {
    return `!${requirement.key}`;
  }

  if (requirement.operator === 'In') {
    return `${requirement.key} in (${toArray(requirement.values).join(',')})`;
  }

  if (requirement.operator === 'NotIn') {
    return `${requirement.key} notin (${toArray(requirement.values).join(',')})`;
  }

  if (requirement.operator === 'GreaterThan') {
    return `${requirement.key} > ${requirement.values[0]}`;
  }

  if (requirement.operator === 'LessThan') {
    return `${requirement.key} < ${requirement.values[0]}`;
  }

  return '';
};

/**
 * Creates a MatchExpression for an equality comparison.
 *
 * This is a utility function for quickly creating the most common type of
 * label selector expression - checking if a label equals a specific value.
 *
 * **Common use cases:**
 * - Building selectors for finding resources with specific labels
 * - Creating equality-based filters for resource lists
 * - Constructing match expressions programmatically
 *
 * @example
 * ```tsx
 * // Create selector for app=frontend
 * const appSelector = createEquals('app', 'frontend');
 * // Returns: {key: 'app', operator: 'Equals', values: ['frontend']}
 *
 * // Use in a selector object
 * const selector = {
 *   matchExpressions: [createEquals('app', 'frontend'), createEquals('version', 'v1.0')]
 * };
 * ```
 *
 * @param key The label key to match
 * @param value The label value to match
 * @returns MatchExpression object for equality comparison
 */
export const createEquals = (key: string, value: string): MatchExpression => ({
  key,
  operator: 'Equals',
  values: [value],
});

const isOldFormat = (selector: Selector | MatchLabels) =>
  !selector.matchLabels && !selector.matchExpressions;

export const toRequirements = (selector: Selector = {}): MatchExpression[] => {
  const requirements = [];
  const matchLabels = isOldFormat(selector) ? selector : selector.matchLabels;
  const { matchExpressions } = selector;

  Object.keys(matchLabels || {})
    .sort()
    .forEach((k) => {
      requirements.push(createEquals(k, matchLabels[k]));
    });

  (matchExpressions || []).forEach((me) => {
    requirements.push(me);
  });

  return requirements;
};

/**
 * Converts a Kubernetes Selector object to its string representation.
 *
 * This function transforms both old-format (matchLabels only) and new-format
 * (matchLabels + matchExpressions) selectors into the string format used by
 * Kubernetes APIs and kubectl commands.
 *
 * **Selector formats supported:**
 * - Legacy format: `{"app": "frontend", "version": "v1"}`
 * - Modern format: `{matchLabels: {...}, matchExpressions: [...]}`
 *
 * **Common use cases:**
 * - Converting selectors for API labelSelector query parameters
 * - Displaying selectors in UI components
 * - Building kubectl-compatible selector strings
 *
 * @example
 * ```tsx
 * // Legacy format selector
 * const legacySelector = {app: 'frontend', version: 'v1'};
 * const selectorString = selectorToString(legacySelector);
 * // Returns: "app=frontend,version=v1"
 * ```
 *
 * @example
 * ```tsx
 * // Modern format selector
 * const modernSelector = {
 *   matchLabels: {app: 'frontend'},
 *   matchExpressions: [
 *     {key: 'environment', operator: 'In', values: ['staging', 'prod']}
 *   ]
 * };
 * const selectorString = selectorToString(modernSelector);
 * // Returns: "app=frontend,environment in (staging,prod)"
 * ```
 *
 * @param selector Kubernetes Selector object (legacy or modern format)
 * @returns Comma-separated string of selector requirements
 */
export const selectorToString = (selector: Selector): string => {
  const requirements = toRequirements(selector);
  return requirements.map(requirementToString).join(',');
};

export const k8sWatch = (
  kind: K8sModel,
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
  const wsOptionsUpdated = Object.assign(
    {
      host: 'auto',
      reconnect: true,
      jsonParse: true,
      bufferFlushInterval: 500,
      bufferMax: 1000,
    },
    wsOptions,
  );

  const { labelSelector } = query;
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
  wsOptionsUpdated.path = path;
  return new WSFactory(path, wsOptionsUpdated as WSOptions);
};

interface PluginStore {
  getExtensionsInUse: () => Extension[];
}

let pluginStore: PluginStore;

export const setPluginStore = (store: PluginStore): void => {
  pluginStore = store;
};

const modelKey = (model: K8sModel): string => {
  // TODO: Use `referenceForModel` even for known API objects
  return model.crd ? getReferenceForModel(model) : model.kind;
};

export const modelsToMap = (
  models: K8sModel[],
): ImmutableMap<K8sResourceKindReference, K8sModel> => {
  return ImmutableMap<K8sResourceKindReference, K8sModel>().withMutations((map) => {
    models.forEach((model) => map.set(modelKey(model), model));
  });
};

export const isModelDefinition = (e: Extension): e is ModelDefinition => {
  return e.type === 'ModelDefinition';
};

/**
 * Contains static resource definitions for Kubernetes objects.
 * Keys are of type `group:version:Kind`, but TypeScript doesn't support regex types (https://github.com/Microsoft/TypeScript/issues/6579).
 */
let k8sModels;

const getK8sModels = () => {
  if (!k8sModels) {
    // TODO this was migrated from console and is only used for the fallback API discovery and can likely be removed
    k8sModels = modelsToMap(_.values(staticModels));

    const hasModel = (model: K8sModel) => k8sModels.has(modelKey(model));

    k8sModels = k8sModels.withMutations((map) => {
      const pluginModels = _.flatMap(
        pluginStore
          .getExtensionsInUse()
          .filter(isModelDefinition)
          .map((md) => md.properties.models),
      );
      map.merge(modelsToMap(pluginModels.filter((model) => !hasModel(model))));
    });
  }
  return k8sModels;
};

// URL routes that can be namespaced
let namespacedResources;

/**
 * Provides a synchronous way to acquire all statically-defined Kubernetes models.
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const allModels = getK8sModels;

export const getNamespacedResources = () => {
  if (!namespacedResources) {
    namespacedResources = new Set();
    allModels().forEach((v, k) => {
      if (!v.namespaced) {
        return;
      }
      if (v.crd) {
        namespacedResources.add(k);
      }
      if (!v.crd || v.legacyPluralURL) {
        namespacedResources.add(v.plural);
      }
    });
  }
  return namespacedResources;
};
