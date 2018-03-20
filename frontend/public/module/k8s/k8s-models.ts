import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKindReference, GroupVersionKind, CustomResourceDefinitionKind, K8sResourceKind, K8sKind, OwnerReference } from './index';
import * as staticModels from '../../models';
import store from '../../redux';

export const referenceFor = (obj: K8sResourceKind): GroupVersionKind => obj.kind && obj.apiVersion
  ? `${obj.kind}:${obj.apiVersion.split('/')[0]}:${obj.apiVersion.split('/')[1]}`
  : '';

export const referenceForCRD = (obj: CustomResourceDefinitionKind): GroupVersionKind => (
  `${obj.spec.names.kind}:${obj.spec.group}:${obj.spec.version}`
);

export const referenceForOwnerRef = (ownerRef: OwnerReference): GroupVersionKind => (
  `${ownerRef.kind}:${ownerRef.apiVersion.split('/')[0]}:${ownerRef.apiVersion.split('/')[1]}`
);

export const referenceForModel = (model: K8sKind): GroupVersionKind => (
  `${model.kind}:${model.apiGroup || ''}:${model.apiVersion}`
);

export const kindForReference = (ref: K8sResourceKindReference) => ref.split(':').length === 3
  ? ref.split(':')[0]
  : ref;

export const versionForReference = (ref: GroupVersionKind) => ref.split(':')[2];

/**
 * Contains static resource definitions for Kubernetes objects.
 * Keys are `Kind:group:version`, but TypeScript doesn't support regex types (https://github.com/Microsoft/TypeScript/issues/6579).
 * Will eventually replace The Enum.
 */
const k8sModels = ImmutableMap<K8sResourceKindReference, K8sKind>()
  .withMutations(models => _.forEach(staticModels, model => {
    if (model.crd) {
      models.set(referenceForModel(model), model);
    } else {
      models.set(model.kind, model);
    }
  }));
// TODO(alecmerdler): Kill the Enum and move definitions to this module with `GroupVersionKind` as keys

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
  // FIXME(alecmerdler): Remove synchronous `store.getState()` call here, should be using `connectToModels` instead, only here for backwards-compatibility
  m = store.getState().KINDS.get('kinds').get(ref);
  if (m) {
    return m;
  }
  m = store.getState().KINDS.get('kinds').get(kindForReference(ref));
  if (m) {
    return m;
  }
};

/**
 * Provides a synchronous way to acquire all statically-defined Kubernetes models.
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const allModels = () => k8sModels;
