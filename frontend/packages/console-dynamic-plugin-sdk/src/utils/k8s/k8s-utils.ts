import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';
import * as staticModels from '@console/internal/models';
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

const getK8sAPIPath = ({ apiGroup = 'core', apiVersion }: K8sModel): string => {
  const isLegacy = apiGroup === 'core' && apiVersion === 'v1';
  let p = isLegacy ? '/api/' : '/apis/';

  if (!isLegacy && apiGroup) {
    p += `${apiGroup}/`;
  }

  p += apiVersion;
  return p;
};

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
    const q = _.map(options.queryParams, function(v, k) {
      return `${k}=${v}`;
    });
    u += `?${q.join('&')}`;
  }

  return u;
};

export const resourceURL = (model: K8sModel, options: Options): string =>
  `${k8sBasePath}${getK8sResourcePath(model, options)}`;

const toArray = (value) => (Array.isArray(value) ? value : [value]);

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
    .forEach(function(k) {
      requirements.push(createEquals(k, matchLabels[k]));
    });

  (matchExpressions || []).forEach(function(me) {
    requirements.push(me);
  });

  return requirements;
};

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
