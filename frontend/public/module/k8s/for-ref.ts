import type {
  GroupVersionKind,
  K8sResourceKindReference,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';

export const isGroupVersionKind = (ref: GroupVersionKind | string) => ref?.split('~').length === 3;

export const kindForReference = (ref: K8sResourceKindReference) =>
  isGroupVersionKind(ref) ? ref.split('~')[2] : ref;

export const apiGroupForReference = (ref: GroupVersionKind) => ref.split('~')[0];

export const versionForReference = (ref: GroupVersionKind) => ref.split('~')[1];

export const apiVersionForReference = (ref: GroupVersionKind) =>
  isGroupVersionKind(ref) ? `${ref.split('~')[0]}/${ref.split('~')[1]}` : ref;
