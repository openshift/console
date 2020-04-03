import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import { K8sResourceKindReference, K8sKind } from './types';
import * as staticModels from '../../models';
import { referenceForModel, kindForReference } from './k8s';
import store from '../../redux';
import { registry } from '../../plugins';

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
let k8sModels = modelsToMap(_.values(staticModels));

const hasModel = (model: K8sKind) => k8sModels.has(modelKey(model));

k8sModels = k8sModels.withMutations((map) => {
  const pluginModels = _.flatMap(registry.getModelDefinitions().map((md) => md.properties.models));
  map.merge(modelsToMap(pluginModels.filter((model) => !hasModel(model))));
});

/**
 * Provides a synchronous way to acquire a statically-defined Kubernetes model.
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const modelFor = (ref: K8sResourceKindReference) => {
  let m = k8sModels.get(ref);
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
  m = k8sModels.get(kindForReference(ref));
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
export const allModels = () => k8sModels;
