import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKindReference, GroupVersionKind, CustomResourceDefinitionKind, K8sResourceKind, K8sKind, OwnerReference } from './index';
import * as staticModels from '../../models';
import store from '../../redux';

export const groupVersionFor = (apiVersion: string) => ({
  group: apiVersion.split('/').length === 2 ? apiVersion.split('/')[0] : 'core',
  version: apiVersion.split('/').length === 2 ? apiVersion.split('/')[1] : apiVersion,
});

export const referenceFor = (obj: K8sResourceKind): GroupVersionKind => obj.kind && obj.apiVersion
  ? `${groupVersionFor(obj.apiVersion).group}:${groupVersionFor(obj.apiVersion).version}:${obj.kind}`
  : '';

export const referenceForCRD = (obj: CustomResourceDefinitionKind): GroupVersionKind => (
  `${obj.spec.group}:${obj.spec.version}:${obj.spec.names.kind}`
);

export const referenceForOwnerRef = (ownerRef: OwnerReference): GroupVersionKind => (
  `${groupVersionFor(ownerRef.apiVersion).group}:${groupVersionFor(ownerRef.apiVersion).version}:${ownerRef.kind}`
);

export const referenceForModel = (model: K8sKind): GroupVersionKind => (
  `${model.apiGroup || 'core'}:${model.apiVersion}:${model.kind}`
);

export const kindForReference = (ref: K8sResourceKindReference) => ref.split(':').length === 3
  ? ref.split(':')[2]
  : ref;

export const versionForReference = (ref: GroupVersionKind) => ref.split(':')[1];

export const apiVersionForModel = (model: K8sKind) => _.isEmpty(model.apiGroup)
  ? model.apiVersion
  : `${model.apiGroup}/${model.apiVersion}`;

export const apiVersionForReference = (ref: GroupVersionKind) => ref.split(':').length === 3
  ? `${ref.split(':')[0]}/${ref.split(':')[1]}`
  : ref;

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
