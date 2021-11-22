import { K8sResourceKindReference, GroupVersionKind } from '../../extensions/console-types';


export const k8sBasePath = `${window.SERVER_FLAGS.basePath}api/kubernetes`;

export const isGroupVersionKind = (ref: GroupVersionKind | string) => ref.split('~').length === 3;

export const kindForReference = (ref: K8sResourceKindReference) =>
  isGroupVersionKind(ref) ? ref.split('~')[2] : ref;