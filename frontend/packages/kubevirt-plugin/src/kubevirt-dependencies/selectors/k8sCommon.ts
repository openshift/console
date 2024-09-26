import * as _ from 'lodash';
import { K8sResourceCommon, K8sResourceKind } from '@console/internal/module/k8s';
import { getValueByPrefix } from './selectors';

export const getDescription = (resource: K8sResourceKind) =>
  resource?.metadata?.annotations?.description;

export const getName = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'metadata.name') as K8sResourceCommon['metadata']['name'];

export const getNamespace = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'metadata.namespace') as K8sResourceCommon['metadata']['namespace'];

export const getAPIVersion = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'apiVersion') as K8sResourceCommon['apiVersion'];

export const getUID = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'metadata.uid') as K8sResourceCommon['metadata']['uid'];

export const getOwnerReferences = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'metadata.ownerReferences') as K8sResourceCommon['metadata']['ownerReferences'];

export const getCreationTimestamp = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'metadata.creationTimestamp') as K8sResourceCommon['metadata']['creationTimestamp'];

export const getKind = (value) => _.get(value, 'kind') as K8sResourceKind['kind'];

// Labels
export const getLabels = (entity: K8sResourceKind, defaultValue?: { [key: string]: string }) =>
  _.get(entity, 'metadata.labels', defaultValue) as K8sResourceKind['metadata']['labels'];

export const getLabel = <A extends K8sResourceKind = K8sResourceKind>(
  value: A,
  label: string,
  defaultValue?: string,
) => (_.has(value, 'metadata.labels') ? value.metadata.labels[label] : defaultValue);

export const hasLabel = (obj: K8sResourceKind, label: string): boolean =>
  _.has(obj, ['metadata', 'labels', label]);

// Annotations
export const getAnnotations = (
  vm: K8sResourceKind,
  defaultValue?: { [key: string]: string },
): { [key: string]: string } => _.get(vm, 'metadata.annotations', defaultValue);

export const getAnnotation = (
  entity: K8sResourceKind,
  annotationName: string,
  defaultValue?: string,
): string => _.get(entity, ['metadata', 'annotations', annotationName], defaultValue);

export const getStatusPhase = <T = string>(entity: K8sResourceKind): T => entity?.status?.phase;

export const getAnnotationKeySuffix = (
  entity: K8sResourceKind,
  annotationPrefix: string,
): string => {
  const annotations = _.get(
    entity,
    'metadata.annotations',
  ) as K8sResourceKind['metadata']['annotations'];
  return getValueByPrefix(annotations, annotationPrefix);
};

export const getStatusConditions = (statusResource: K8sResourceKind, defaultValue = []) =>
  _.get(statusResource, 'status.conditions') === undefined
    ? defaultValue
    : statusResource.status.conditions;

export const getStatusConditionOfType = (statusResource: K8sResourceKind, type: string) =>
  getStatusConditions(statusResource).find((condition) => condition.type === type);

export const getDeletetionTimestamp = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'metadata.deletionTimestamp') as K8sResourceCommon['metadata']['deletionTimestamp'];
