/* eslint-disable no-undef, no-unused-vars */

import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';

import { K8sResourceKindReference, K8sFullyQualifiedResourceReference, K8sKind } from './index';
import { k8sKinds } from './enum';

/**
 * Contains static resource definitions for Kubernetes objects.
 * Keys are `Kind:group:version`, but TypeScript doesn't support regex types (https://github.com/Microsoft/TypeScript/issues/6579).
 * Will eventually replace The Enum.
 */
const k8sModels = ImmutableMap<string, K8sKind>()
  .set('AlphaCatalogEntry-v1:app.coreos.com:v1alpha1', {
    kind: 'AlphaCatalogEntry-v1',
    label: 'AlphaCatalogEntry-v1',
    labelPlural: 'AlphaCatalogEntry-v1s',
    basePath: '/apis/app.coreos.com/',
    apiVersion: 'v1alpha1',
    path: 'alphacatalogentry-v1s',
    abbr: 'CE',
    namespaced: true,
    plural: 'alphacatalogentry-v1s',
  })
  .set('ClusterServiceVersion-v1:app.coreos.com:v1alpha1', {
    kind: 'ClusterServiceVersion-v1',
    label: 'ClusterServiceVersion-v1',
    labelPlural: 'ClusterServiceVersion-v1s',
    basePath: '/apis/app.coreos.com/',
    apiVersion: 'v1alpha1',
    path: 'clusterserviceversion-v1s',
    abbr: 'CSV',
    namespaced: true,
    plural: 'clusterserviceversion-v1s',
  })
  .set('InstallPlan-v1:app.coreos.com:v1alpha1', {
    kind: 'InstallPlan-v1',
    label: 'InstallPlan-v1',
    labelPlural: 'InstallPlan-v1s',
    basePath: '/apis/app.coreos.com/',
    apiVersion: 'v1alpha1',
    path: 'installplan-v1s',
    abbr: 'IP',
    namespaced: true,
    plural: 'installplan-v1s',
  })
  // TODO(alecmerdler): Kill the Enum and move definitions to this module with `K8sFullyQualifiedResourceReference` as keys
  .withMutations((models) => _.forEach(k8sKinds, (kind, kindName) => models.set(kindName, kind)));

export const modelKeyFor = (ref: K8sResourceKindReference = '') => (ref as K8sFullyQualifiedResourceReference).kind
  ? `${(ref as K8sFullyQualifiedResourceReference).kind}:${(ref as K8sFullyQualifiedResourceReference).group}:${(ref as K8sFullyQualifiedResourceReference).version}`
  : (ref as string);

export const referenceForKey = (key: string): K8sResourceKindReference => key.split(':').length === 3
  ? {kind: key.split(':')[0], group: key.split(':')[1], version: key.split(':')[2]}
  : key;

/**
 * Provides a synchronous way to acquire a statically-defined Kubernetes model. 
 * NOTE: This will not work for CRDs defined at runtime, use `connectToModels` instead.
 */
export const modelFor = (ref: K8sResourceKindReference) => k8sModels.get(modelKeyFor(ref));

export const allModels = () => k8sModels;
