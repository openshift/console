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

/**
 * Safely parse a JSON annotation that is expected to contain an array of strings.
 * Returns an empty array if the annotation is missing, malformed, or not an array of strings.
 */
export const parseJSONArrayAnnotation = (
  annotations: ObjectMetadata['annotations'],
  annotationKey: string,
  onError?: (err: Error) => void,
): string[] => {
  const parsed = parseJSONAnnotation(annotations, annotationKey, onError);
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
    if (parsed != null) {
      const error = new Error(
        `Expected annotation "${annotationKey}" to be an array of strings, got ${typeof parsed}`,
      );
      onError?.(error);
      // eslint-disable-next-line no-console
      console.warn(error.message);
    }
    return [];
  }
  return parsed;
};
