import type { ObjectMetadata } from '@console/internal/module/k8s';

export const parseJSONAnnotation = <T = any>(
  annotations: ObjectMetadata['annotations'],
  key: string,
  options: ParseJSONAnnotationOptions,
): T => {
  const { validate, onError } = options ?? {};
  const annotation = annotations?.[key];
  if (!annotation) {
    return null;
  }
  try {
    const parsed: T = JSON.parse(annotation);
    const valid = validate?.(parsed) ?? true;
    if (!valid) {
      throw new Error(`Invalid value: "${annotation}"`);
    }
    return parsed;
  } catch (e) {
    onError?.(e.message);
    return null;
  }
};

type ParseJSONAnnotationOptions = {
  validate?: (value: any) => boolean;
  onError?: (error: any) => void;
};
