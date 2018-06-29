/* eslint-disable no-unused-vars */

import * as _ from 'lodash-es';

import { K8sResourceKindReference, GroupVersionKind, CustomResourceDefinitionKind, K8sResourceKind, K8sKind, OwnerReference } from './index';

export const getQN: (obj: K8sResourceKind) => string = ({metadata: {name, namespace}}) => (namespace ? `(${namespace})-` : '') + name;

export const k8sBasePath = `${(window as any).SERVER_FLAGS.basePath}api/kubernetes`;

export const isGroupVersionKind = (ref: GroupVersionKind | string) => ref.split(':').length === 3;

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

export const kindForReference = (ref: K8sResourceKindReference) => isGroupVersionKind(ref)
  ? ref.split(':')[2]
  : ref;

export const versionForReference = (ref: GroupVersionKind) => ref.split(':')[1];

export const apiVersionForModel = (model: K8sKind) => _.isEmpty(model.apiGroup)
  ? model.apiVersion
  : `${model.apiGroup}/${model.apiVersion}`;

export const apiVersionForReference = (ref: GroupVersionKind) => isGroupVersionKind(ref)
  ? `${ref.split(':')[0]}/${ref.split(':')[1]}`
  : ref;
