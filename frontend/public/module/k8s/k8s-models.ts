import * as _ from 'lodash';
import type { K8sResourceKindReference, ModelMetadata } from '@console/dynamic-plugin-sdk';
import { isModelMetadata } from '@console/dynamic-plugin-sdk';
import type {
  K8sKind,
  DiscoveryResources,
  K8sModel,
} from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { apiVersionCompare } from '@console/internal/module/k8s/crd-versions';
import { kindForReference } from '@console/internal/module/k8s/for-ref';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import * as staticModels from '../../models';
import { pluginStore } from '../../plugins';
import store from '../../redux';
import { getModelExtensionMetadata } from './get-resources';
import { referenceForModel, referenceForGroupVersionKind } from './k8s-ref';

const modelKey = (model: K8sKind): string =>
  // TODO: Use `referenceForModel` even for known API objects
  model.crd ? referenceForModel(model) : model.kind;
export const modelsToMap = (models: K8sKind[]): Record<K8sResourceKindReference, K8sKind> => {
  const map: Record<string, K8sKind> = {};
  models.forEach((model) => {
    map[modelKey(model)] = model;
  });
  return map;
};

/**
 * Contains static resource definitions for Kubernetes objects.
 * Keys are of type `group:version:Kind`, but TypeScript doesn't support regex types (https://github.com/Microsoft/TypeScript/issues/6579).
 */
let k8sModels: Record<string, K8sKind>;

const getK8sModels = () => {
  if (!k8sModels) {
    k8sModels = modelsToMap(_.values(staticModels));
  }
  return k8sModels;
};

/**
 * Provides a synchronous way to acquire a statically-defined Kubernetes model.
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const modelFor = (ref: K8sResourceKindReference): K8sModel => {
  const metadataExtensions = pluginStore
    .getExtensions()
    .filter(isModelMetadata) as LoadedExtension<ModelMetadata>[];

  let m = getK8sModels()[ref];
  if (m) {
    const metadata = getModelExtensionMetadata(
      metadataExtensions,
      m?.apiGroup,
      m?.apiVersion,
      m?.kind,
    );
    return _.merge({}, m, metadata);
  }

  // FIXME: Remove synchronous `store.getState()` call here, should be using `connectToModels` instead, only here for backwards-compatibility
  m = store.getState().k8s.RESOURCES?.models?.[ref];
  if (m) {
    return m;
  }

  m = getK8sModels()[kindForReference(ref)];
  if (m) {
    const metadata = getModelExtensionMetadata(
      metadataExtensions,
      m?.apiGroup,
      m?.apiVersion,
      m?.kind,
    );
    return _.merge({}, m, metadata);
  }

  m = store.getState().k8s.RESOURCES?.models?.[kindForReference(ref)];
  if (m) {
    return m;
  }
};

/**
 * Provides a synchronous way to acquire an API discovered Kubernetes model by group and kind only.
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const modelForGroupKind = (group: string, kind: string): K8sKind => {
  const models: Record<string, K8sKind> = store.getState().k8s.RESOURCES?.models ?? {};
  const groupVersionMap: DiscoveryResources['groupVersionMap'] =
    store.getState().k8s.RESOURCES?.groupToVersionMap;

  const { preferredVersion, versions } = groupVersionMap?.[group] || {};
  if (preferredVersion) {
    const ref = referenceForGroupVersionKind(group)(preferredVersion)(kind);
    const model = models[ref];
    if (model) {
      return model;
    }
  }
  if (versions) {
    const sortedVersions: string[] = [...versions].sort(apiVersionCompare);
    for (const version of sortedVersions) {
      const ref = referenceForGroupVersionKind(group)(version)(kind);
      const model = models[ref];
      if (model) {
        return model;
      }
    }
  }
  return null;
};

/**
 * Provides a synchronous way to acquire all statically-defined Kubernetes models.
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const allModels = getK8sModels;

/**
 * Use this hook to find the model for resources using only group and plural
 */
export const useModelFinder = () => {
  const referenceForGroupVersionPlural = (group: string) => (version: string) => (plural: string) =>
    [group || 'core', version, plural].join('~');

  const models = useConsoleSelector<Record<string, K8sModel>>(({ k8s }) => k8s.RESOURCES?.models);
  const pluralsToModelMap = Object.values(models ?? {}).reduce((acc, curr) => {
    const ref = referenceForGroupVersionPlural(curr.apiGroup)(curr.apiVersion)(curr.plural);
    acc[ref] = curr;
    return acc;
  }, {});
  const groupVersionMap = useConsoleSelector<DiscoveryResources['groupVersionMap']>(
    ({ k8s }) => k8s.RESOURCES?.groupToVersionMap,
  );

  const findModel = (group: string, resource: string) => {
    if (!group) {
      const refPlural = referenceForGroupVersionPlural(group)('v1')(resource);
      const model = pluralsToModelMap[refPlural];
      if (model) {
        return model;
      }
    }
    const { preferredVersion, versions } = groupVersionMap?.[group] || {};
    if (preferredVersion) {
      const ref = referenceForGroupVersionPlural(group)(preferredVersion)(resource);
      const model = pluralsToModelMap[ref];
      if (model) {
        return model;
      }
    }
    if (versions) {
      const sortedVersions: string[] = [...versions].sort(apiVersionCompare);
      for (const version of sortedVersions) {
        const ref = referenceForGroupVersionPlural(group)(version)(resource);
        const model = pluralsToModelMap[ref];
        if (model) {
          return model;
        }
      }
    }
    return null;
  };
  return { findModel };
};
