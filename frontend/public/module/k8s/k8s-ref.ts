// TODO(alecmerdler): Replace all manual string building with this function
export const referenceForGroupVersionKind = (group: string) => (version: string) => (
  kind: string,
) => [group, version, kind].join('~');

export {
  getReferenceForModel as referenceForModel,
  getAPIVersionForModel as apiVersionForModel,
} from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
