import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import { K8sResourceKindReference, K8sKind } from './index';
import * as staticModels from '../../models';
import { referenceForModel, kindForReference } from './k8s';
import store from '../../redux';
import * as plugins from '../../plugins';

export const modelsToMap = (models: K8sKind[]): ImmutableMap<K8sResourceKindReference, K8sKind> => {
  return ImmutableMap<K8sResourceKindReference, K8sKind>()
    .withMutations(map => {
      models.forEach(model => {
        if (model.crd) {
          map.set(referenceForModel(model), model);
        } else {
          // TODO: Use `referenceForModel` even for known API objects
          map.set(model.kind, model);
        }
      });
    });
};

/**
 * Contains static resource definitions for Kubernetes objects.
 * Keys are of type `group:version:Kind`, but TypeScript doesn't support regex types (https://github.com/Microsoft/TypeScript/issues/6579).
 */
let k8sModels = modelsToMap(_.values(staticModels));

const hasModel = (model: K8sKind) => k8sModels.has(referenceForModel(model)) || k8sModels.has(model.kind);

k8sModels = k8sModels.withMutations(map => {
  const baseModelCount = map.size;
  const pluginModels = _.flatMap(plugins.registry.getModelDefinitions().map(md => md.properties.models));

  const pluginModelsToAdd = pluginModels.filter(model => (model.specialized || !hasModel(model)));
  map.merge(modelsToMap(pluginModelsToAdd));

  _.difference(pluginModels, pluginModelsToAdd).forEach(model => {
    // eslint-disable-next-line no-console
    console.warn(`attempt to redefine model ${referenceForModel(model)}`);
  });

  // eslint-disable-next-line no-console
  console.info(`${map.size - baseModelCount} new models added by plugins`);
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
  m = store.getState().k8s.getIn(['RESOURCES', 'models']).get(ref);
  if (m) {
    return m;
  }
  m = k8sModels.get(kindForReference(ref));
  if (m) {
    return m;
  }
  m = store.getState().k8s.getIn(['RESOURCES', 'models']).get(kindForReference(ref));
  if (m) {
    return m;
  }
};

/**
 * Provides a synchronous way to acquire all statically-defined Kubernetes models.
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const allModels = () => k8sModels;
