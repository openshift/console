import { getReference } from '@console/dynamic-plugin-sdk/src/utils/k8s';

// TODO(alecmerdler): Replace all manual string building with this function

/**
 * @deprecated - Use getReference if absolutely needed, otherwise pivot towards using K8sGroupVersionKind objects where possible
 */
export const referenceForGroupVersionKind = (group: string, version: string, kind: string) =>
  getReference({ group, version, kind });

export {
  getReferenceForModel as referenceForModel,
  getAPIVersionForModel as apiVersionForModel,
} from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
