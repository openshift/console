import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { VMGenericLikeEntityKind } from '../types/vmLike';

export const getKind = (value) => _.get(value, 'kind') as K8sResourceKind['kind'];

export const getGeneratedName = (value) =>
  _.get(value, 'metadata.generateName') as K8sResourceKind['metadata']['generateName'];

export const getDescription = (vm: VMGenericLikeEntityKind) =>
  _.get(vm, 'metadata.annotations.description');

export const getStorageSize = (value): string => _.get(value, 'requests.storage');

export const getValueByPrefix = (obj = {}, keyPrefix: string): string => {
  const objectKey = Object.keys(obj).find((key) => key.startsWith(keyPrefix));
  return objectKey ? obj[objectKey] : null;
};

// Labels
export const getLabels = (entity: K8sResourceKind, defaultValue?: { [key: string]: string }) =>
  _.get(entity, 'metadata.labels', defaultValue) as K8sResourceKind['metadata']['labels'];

export const getLabelValue = (entity: K8sResourceKind, label: string): string =>
  _.get(entity, ['metadata', 'labels', label]);

// Annotations
export const getAnnotations = (
  vm: VMGenericLikeEntityKind,
  defaultValue?: { [key: string]: string },
): { [key: string]: string } => _.get(vm, 'metadata.annotations', defaultValue);

export const getAnnotation = (
  entity: K8sResourceKind,
  annotationName: string,
  defaultValue?: string,
): string => _.get(entity, ['metadata', 'annotations', annotationName], defaultValue);

export const getParameterValue = (obj, name: string, defaultValue = null): string =>
  _.get(obj, ['parameters'], []).find((parameter) => parameter.name === name)?.value ||
  defaultValue;

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

export const getStatusPhase = <T = string>(entity: K8sResourceKind): T => entity?.status?.phase;

export const getStatusConditions = (statusResource: K8sResourceKind, defaultValue = []) =>
  _.get(statusResource, 'status.conditions') === undefined
    ? defaultValue
    : statusResource.status.conditions;

export const getStatusConditionOfType = (statusResource: K8sResourceKind, type: string) =>
  getStatusConditions(statusResource).find((condition) => condition.type === type);

export const getConditionReason = (condition) => condition && condition.reason;
export const isConditionStatusTrue = (condition) => (condition && condition.status) === 'True';
export const isConditionReason = (condition, reason) => getConditionReason(condition) === reason;
