import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { K8sGroupVersionKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { referenceForGroupVersionKind } from '@console/internal/module/k8s/k8s-ref';

/** Resolve the preference and extension ID shared by column management and column widths. */
export const getConsoleDataViewID = (id: K8sModel | K8sGroupVersionKind | string): string => {
  if (typeof id === 'string') {
    return id;
  }

  const isModel = 'apiVersion' in id;
  if (isModel) {
    return referenceForModel(id);
  }
  return referenceForGroupVersionKind(id.group || 'core')(id.version)(id.kind);
};
