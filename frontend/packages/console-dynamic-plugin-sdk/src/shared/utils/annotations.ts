import { ObjectMetadata } from '@console/internal/module/k8s';

export const parseJSONAnnotation = (
  annotations: ObjectMetadata['annotations'],
  annotationKey: string,
  onError?: (err: Error) => void,
  defaultReturn?: any,
): any => {
  try {
    return annotations?.[annotationKey] ? JSON.parse(annotations?.[annotationKey]) : defaultReturn;
  } catch (e) {
    onError?.(e);
    // eslint-disable-next-line no-console
    console.warn(`Could not parse annotation ${annotationKey} as JSON: `, e);
    return defaultReturn;
  }
};
