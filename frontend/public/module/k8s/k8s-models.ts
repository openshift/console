import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';

import { K8sResourceKindReference, K8sKind, DiscoveryResources } from './index';
import * as staticModels from '../../models';
import { referenceForModel, kindForReference, apiVersionCompare } from './k8s';
import store from '../../redux';
import { pluginStore } from '../../plugins';
import { isModelDefinition } from '@console/plugin-sdk';

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
          .getAllExtensions()
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
  let m = getK8sModels().get(ref);
  if (m) {
    return m;
  }
  // FIXME: Remove synchronous `store.getState()` call here, should be using `connectToModels` instead, only here for backwards-compatibility
  m = store
    .getState()
    .k8s.getIn(['RESOURCES', 'models'])
    .get(ref);
  if (m) {
    return m;
  }
  m = getK8sModels().get(kindForReference(ref));
  if (m) {
    return m;
  }
  m = store
    .getState()
    .k8s.getIn(['RESOURCES', 'models'])
    .get(kindForReference(ref));
  if (m) {
    return m;
  }
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

  const models: ImmutableMap<string, K8sKind> = useSelector(({ k8s }) =>
    k8s.getIn(['RESOURCES', 'models']),
  );
  const pluralsToModelMap = models.reduce((acc, curr) => {
    const ref = referenceForGroupVersionPlural(curr.apiGroup)(curr.apiVersion)(curr.plural);
    acc[ref] = curr;
    return acc;
  }, {});
  const groupVersionMap: DiscoveryResources['groupVersionMap'] = useSelector(({ k8s }) =>
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
