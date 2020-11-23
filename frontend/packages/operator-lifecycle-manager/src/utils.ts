import { parseJSONAnnotation } from '@console/shared/src/utils/annotations';
import { ObjectMetadata } from '@console/internal/module/k8s';
import { INTERNAL_OBJECTS_ANNOTATION } from './const';

export const getInternalObjects = (annotations: ObjectMetadata['annotations']): string[] =>
  parseJSONAnnotation(annotations, INTERNAL_OBJECTS_ANNOTATION) ?? [];
