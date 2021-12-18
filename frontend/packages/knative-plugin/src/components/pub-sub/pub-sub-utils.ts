import { FormikValues } from 'formik';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';

export const RESOURCE_KEY_SEPERATOR = '#';

export const getResourceApiGroup = (apiVersion: string): string => apiVersion.split('/')[0];

export const getSinkableResourceOrder = (apiVersion: string): number => {
  const sortOrder = {
    'serving.knative.dev': 1,
    'messaging.knative.dev': 2,
    'eventing.knative.dev': 3,
  };
  return sortOrder[getResourceApiGroup(apiVersion)] ?? 4;
};
export const craftResourceKey = (key: string, resource: K8sResourceKind): string | undefined => {
  if (!resource?.apiVersion) return undefined;
  const { apiVersion } = resource;
  return key
    ? [getSinkableResourceOrder(apiVersion), referenceFor(resource), key].join(
        RESOURCE_KEY_SEPERATOR,
      )
    : undefined;
};

export const getResourceNameFromKey = (key: string): string =>
  key?.split(RESOURCE_KEY_SEPERATOR).pop() ?? '';

export const sanitizeResourceName = (values: FormikValues): FormikValues => {
  const finalValues = { ...values };
  finalValues.spec.subscriber.ref.name = getResourceNameFromKey(values.spec.subscriber.ref.name);
  return finalValues;
};
