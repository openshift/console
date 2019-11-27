import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const hasLabel = (obj: K8sResourceKind, label: string): boolean =>
  _.has(obj, ['metadata', 'labels', label]);
export const getName = <A extends K8sResourceKind = K8sResourceKind>(value: A) =>
  _.get(value, 'metadata.name') as K8sResourceKind['metadata']['name'];
export const getNamespace = <A extends K8sResourceKind = K8sResourceKind>(value: A) =>
  _.get(value, 'metadata.namespace') as K8sResourceKind['metadata']['namespace'];
export const getUID = <A extends K8sResourceKind = K8sResourceKind>(value: A) =>
  _.get(value, 'metadata.uid') as K8sResourceKind['metadata']['uid'];
export const getDeletetionTimestamp = <A extends K8sResourceKind = K8sResourceKind>(value: A) =>
  _.get(value, 'metadata.deletionTimestamp') as K8sResourceKind['metadata']['deletionTimestamp'];
export const getCreationTimestamp = <A extends K8sResourceKind = K8sResourceKind>(value: A) =>
  _.get(value, 'metadata.creationTimestamp') as K8sResourceKind['metadata']['creationTimestamp'];
export const getAPIVersion = <A extends K8sResourceKind = K8sResourceKind>(value: A) =>
  _.get(value, 'apiVersion') as K8sResourceKind['apiVersion'];
export const getKind = <A extends K8sResourceKind = K8sResourceKind>(value: A) =>
  _.get(value, 'kind') as K8sResourceKind['kind'];
export const getOwnerReferences = <A extends K8sResourceKind = K8sResourceKind>(value: A) =>
  _.get(value, 'metadata.ownerReferences') as K8sResourceKind['metadata']['ownerReferences'];
