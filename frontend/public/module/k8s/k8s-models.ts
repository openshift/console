import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';
import { useSelector } from 'react-redux';

import { getModelExtensionMetadata } from './get-resources';
import * as staticModels from '../../models';
import {
  apiVersionCompare,
  kindForReference,
  referenceForModel,
} from '@console/internal/module/k8s/k8s';
import { referenceForGroupVersionKind } from './k8s-ref';
import store, { RootState } from '../../redux';
import { pluginStore } from '../../plugins';
import { isModelDefinition, LoadedExtension } from '@console/plugin-sdk';
import {
  isModelMetadata,
  K8sResourceKindReference,
  ModelMetadata,
} from '@console/dynamic-plugin-sdk';
import {
  K8sKind,
  DiscoveryResources,
  K8sModel,
} from '@console/dynamic-plugin-sdk/src/api/common-types';

const modelKey = (model: K8sKind): string => {
  // TODO: Use `referenceForModel` even for known API objects
  return model.crd ? referenceForModel(model) : model.kind;
};

export const modelsToMap = (models: K8sKind[]): ImmutableMap<K8sResourceKindReference, K8sKind> => {
  return ImmutableMap<K8sResourceKindReference, K8sKind>().withMutations((map) => {
    models.forEach((model) => map.set(modelKey(model), model));
  });
};

/**
 * Contains static resource definitions for Kubernetes objects.
 * Keys are of type `group:version:Kind`, but TypeScript doesn't support regex types (https://github.com/Microsoft/TypeScript/issues/6579).
 */
let k8sModels;

const getK8sModels = () => {
  if (!k8sModels) {
    k8sModels = modelsToMap(_.values(staticModels));

    const hasModel = (model: K8sKind) => k8sModels.has(modelKey(model));

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

/**
 * Provides a synchronous way to acquire a statically-defined Kubernetes model.
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const modelFor = (ref: K8sResourceKindReference) => {
  const metadataExtensions = pluginStore
    .getExtensionsInUse()
    .filter(isModelMetadata) as LoadedExtension<ModelMetadata>[];

  let m = getK8sModels().get(ref);
  if (m) {
    const metadata = getModelExtensionMetadata(metadataExtensions, m?.group, m?.version, m?.kind);
    return _.merge(m, metadata);
  }

  // FIXME: Remove synchronous `store.getState()` call here, should be using `connectToModels` instead, only here for backwards-compatibility
  m = store.getState().k8s.getIn(['RESOURCES', 'models']).get(ref);
  if (m) {
    return m;
  }

  m = getK8sModels().get(kindForReference(ref));
  if (m) {
    const metadata = getModelExtensionMetadata(metadataExtensions, m?.group, m?.version, m?.kind);
    return _.merge(m, metadata);
  }

  m = store.getState().k8s.getIn(['RESOURCES', 'models']).get(kindForReference(ref));
  if (m) {
    return m;
  }
};

/**
 * Provides a synchronous way to acquire an API discovered Kubernetes model by group and kind only.
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const modelForGroupKind = (group: string, kind: string): K8sKind => {
  const models: ImmutableMap<string, K8sKind> = store.getState().k8s.getIn(['RESOURCES', 'models']);
  const groupVersionMap: DiscoveryResources['groupVersionMap'] = store
    .getState()
    .k8s.getIn(['RESOURCES', 'groupToVersionMap']);

  const { preferredVersion, versions } = groupVersionMap?.[group] || {};
  if (preferredVersion) {
    // Find a model for the CRD that uses this preferred version
    const ref = referenceForGroupVersionKind(group)(preferredVersion)(kind);
    const model = models.get(ref);
    if (model) {
      return model;
    }
  }
  // In case the preferred version does not have the CRD
  if (versions) {
    const sortedVersions: string[] = versions.sort(apiVersionCompare);
    for (const version of sortedVersions) {
      const ref = referenceForGroupVersionKind(group)(version)(kind);
      const model = models.get(ref);
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

  const models = useSelector<RootState, ImmutableMap<string, K8sModel>>(({ k8s }) =>
    k8s.getIn(['RESOURCES', 'models']),
  );
  const pluralsToModelMap = models.reduce((acc, curr) => {
    const ref = referenceForGroupVersionPlural(curr.apiGroup)(curr.apiVersion)(curr.plural);
    acc[ref] = curr;
    return acc;
  }, {});
  const groupVersionMap = useSelector<RootState, DiscoveryResources['groupVersionMap']>(({ k8s }) =>
    k8s.getIn(['RESOURCES', 'groupToVersionMap']),
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
      // Find a model for the CRD that uses this preferred version
      const ref = referenceForGroupVersionPlural(group)(preferredVersion)(resource);
      const model = pluralsToModelMap[ref];
      if (model) {
        return model;
      }
    }
    // In case the preferred version does not have the CRD
    if (versions) {
      const sortedVersions: string[] = versions.sort(apiVersionCompare);
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
