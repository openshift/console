import * as _ from 'lodash';
import { K8sResourceCommon } from '@console/internal/module/k8s';

export const hasLabel = (obj: K8sResourceCommon, label: string): boolean =>
  _.has(obj, ['metadata', 'labels', label]);
export const getName = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'metadata.name') as K8sResourceCommon['metadata']['name'];
export const getNamespace = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'metadata.namespace') as K8sResourceCommon['metadata']['namespace'];
export const getUID = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'metadata.uid') as K8sResourceCommon['metadata']['uid'];
export const getDeletetionTimestamp = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'metadata.deletionTimestamp') as K8sResourceCommon['metadata']['deletionTimestamp'];
export const getCreationTimestamp = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'metadata.creationTimestamp') as K8sResourceCommon['metadata']['creationTimestamp'];
export const getAPIVersion = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'apiVersion') as K8sResourceCommon['apiVersion'];
export const getKind = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'kind') as K8sResourceCommon['kind'];
export const getOwnerReferences = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'metadata.ownerReferences') as K8sResourceCommon['metadata']['ownerReferences'];
