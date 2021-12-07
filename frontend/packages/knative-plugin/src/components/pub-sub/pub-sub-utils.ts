import { FormikValues } from 'formik';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';

export const RESOURCE_KEY_SEPERATOR = '#';

export const craftResourceKey = (key: string, resource: K8sResourceKind): string | undefined =>
  key ? `${referenceFor(resource)}${RESOURCE_KEY_SEPERATOR}${key}` : undefined;

export const getResourceNameFromKey = (key: string): string =>
  key?.split(RESOURCE_KEY_SEPERATOR).pop() ?? '';

export const sanitizeResourceName = (values: FormikValues): FormikValues => {
  const finalValues = { ...values };
  finalValues.spec.subscriber.ref.name = getResourceNameFromKey(values.spec.subscriber.ref.name);
  return finalValues;
};
