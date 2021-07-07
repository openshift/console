import * as _ from 'lodash';
import {
  PodKind,
  K8sResourceKind,
  NodeKind,
  K8sResourceCommon,
} from '@console/internal/module/k8s';

export const getKind = (value) => _.get(value, 'kind') as K8sResourceKind['kind'];

export const getGeneratedName = (value) =>
  _.get(value, 'metadata.generateName') as K8sResourceKind['metadata']['generateName'];

export const getDescription = (resource: K8sResourceKind) =>
  resource?.metadata?.annotations?.description;

export const getStorageSize = (value): string => _.get(value, 'requests.storage');

export const getValueByPrefix = (obj = {}, keyPrefix: string): string => {
  const objectKey = Object.keys(obj).find((key) => key.startsWith(keyPrefix));
  return objectKey ? obj[objectKey] : null;
};

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

export const getDeletetionTimestamp = <A extends K8sResourceCommon = K8sResourceCommon>(value: A) =>
  _.get(value, 'metadata.deletionTimestamp') as K8sResourceCommon['metadata']['deletionTimestamp'];

// Labels
export const getLabels = (entity: K8sResourceKind, defaultValue?: { [key: string]: string }) =>
  _.get(entity, 'metadata.labels', defaultValue) as K8sResourceKind['metadata']['labels'];

export const getLabel = <A extends K8sResourceKind = K8sResourceKind>(
  value: A,
  label: string,
  defaultValue?: string,
) => (_.has(value, 'metadata.labels') ? value.metadata.labels[label] : defaultValue);

export const getLabelValue = (entity: K8sResourceKind, label: string): string =>
  _.get(entity, ['metadata', 'labels', label]);

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

export const getNodeName = (pod: PodKind): PodKind['spec']['nodeName'] =>
  pod && pod.spec ? pod.spec.nodeName : undefined;

export const getNodeTaints = (node: NodeKind) => node?.spec?.taints;
