import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKindReference, K8sKind } from './index';
import * as staticModels from '../../models';
import { referenceForModel, kindForReference } from './k8s';
import store from '../../redux';

/**
 * Contains static resource definitions for Kubernetes objects.
 * Keys are of type `group:version:Kind`, but TypeScript doesn't support regex types (https://github.com/Microsoft/TypeScript/issues/6579).
 */
const k8sModels = ImmutableMap<K8sResourceKindReference, K8sKind>()
  .withMutations(models => _.forEach(staticModels, model => {
    if (model.crd) {
      models.set(referenceForModel(model), model);
    } else {
      // TODO: Use `referenceForModel` even for known API objects
      models.set(model.kind, model);
    }
  }));

/**
 * Provides a synchronous way to acquire a statically-defined Kubernetes model.
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const modelFor = (ref: K8sResourceKindReference) => {
  let m = k8sModels.get(ref);
  if (m) {
    return m;
  }
  m = k8sModels.get(kindForReference(ref));
  if (m) {
    return m;
  }
  // FIXME: Remove synchronous `store.getState()` call here, should be using `connectToModels` instead, only here for backwards-compatibility
  m = store.getState().k8s.getIn(['RESOURCES', 'models']).get(ref);
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
