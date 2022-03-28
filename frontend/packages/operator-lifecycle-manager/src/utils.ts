import { ObjectMetadata } from '@console/internal/module/k8s';
import { parseJSONAnnotation } from '@console/shared/src/utils/annotations';
import { INTERNAL_OBJECTS_ANNOTATION, OPERATOR_PLUGINS_ANNOTATION } from './const';

export const getClusterServiceVersionPlugins = (
  annotations: ObjectMetadata['annotations'],
): string[] => parseJSONAnnotation(annotations, OPERATOR_PLUGINS_ANNOTATION) ?? [];

export const getInternalObjects = (annotations: ObjectMetadata['annotations']): string[] =>
  parseJSONAnnotation(annotations, INTERNAL_OBJECTS_ANNOTATION) ?? [];

export const isCatalogSourceTrusted = (catalogSource: string): boolean =>
  catalogSource === 'redhat-operators';
