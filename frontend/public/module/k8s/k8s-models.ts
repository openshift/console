/* eslint-disable no-undef, no-unused-vars */

import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';

import { K8sResourceKindReference, K8sFullyQualifiedResourceReference, CustomResourceDefinitionKind, K8sResourceKind, K8sKind, OwnerReference } from './index';
import { ClusterServiceVersionModel, AlphaCatalogEntryModel, InstallPlanModel } from '../../models';
import { k8sKinds } from './enum';

export const referenceFor = (obj: K8sResourceKind): K8sFullyQualifiedResourceReference => obj.kind && obj.apiVersion
  ? `${obj.kind}:${obj.apiVersion.split('/')[0]}:${obj.apiVersion.split('/')[1]}`
  : '';

export const referenceForCRD = (obj: CustomResourceDefinitionKind): K8sFullyQualifiedResourceReference => (
  `${obj.spec.names.kind}:${obj.spec.group}:${obj.spec.version}`
);

export const referenceForOwnerRef = (ownerRef: OwnerReference): K8sFullyQualifiedResourceReference => (
  `${ownerRef.kind}:${ownerRef.apiVersion.split('/')[0]}:${ownerRef.apiVersion.split('/')[1]}`
);

export const referenceForModel = (model: K8sKind): K8sFullyQualifiedResourceReference => (
  `${model.kind}:${model.basePath.slice(6, -1)}:${model.apiVersion}`
);

export const kindForReference = (ref: K8sResourceKindReference) => ref.split(':').length === 3
  ? ref.split(':')[0]
  : ref;

/**
 * Contains static resource definitions for Kubernetes objects.
 * Keys are `Kind:group:version`, but TypeScript doesn't support regex types (https://github.com/Microsoft/TypeScript/issues/6579).
 * Will eventually replace The Enum.
 */
const k8sModels = ImmutableMap<K8sResourceKindReference, K8sKind>()
  .set(referenceForModel(AlphaCatalogEntryModel), AlphaCatalogEntryModel)
  .set(referenceForModel(ClusterServiceVersionModel), ClusterServiceVersionModel)
  .set(referenceForModel(InstallPlanModel), InstallPlanModel)
  // TODO(alecmerdler): Kill the Enum and move definitions to this module with `K8sFullyQualifiedResourceReference` as keys
  .withMutations((models) => _.forEach(k8sKinds, (kind, kindName) => models.set(kindName, kind)));

/**
 * Provides a synchronous way to acquire a statically-defined Kubernetes model. 
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const modelFor = (ref: K8sResourceKindReference) => k8sModels.get(ref) || k8sModels.get(kindForReference(ref));
/**
 * Provides a synchronous way to acquire all statically-defined Kubernetes models. 
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const allModels = () => k8sModels;
