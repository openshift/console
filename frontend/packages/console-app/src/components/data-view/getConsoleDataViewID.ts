import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { K8sGroupVersionKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

/** Resolve the preference and extension ID shared by column management and column widths. */
export const getConsoleDataViewID = (
  id?: K8sModel | K8sGroupVersionKind | string,
): string | undefined => {
  if (typeof id === 'string') {
    return id;
  }
  if (!id) {
    return undefined;
  }

  const isModel = 'apiVersion' in id;
  const group = isModel ? id.apiGroup : id.group;
  const version = isModel ? id.apiVersion : id.version;
  return [group || 'core', version, id.kind].join('~');
};
