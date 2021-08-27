import { NamespaceModel, ProjectModel } from '@console/internal/models';
import { k8sGet } from '@console/internal/module/k8s';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';

export const checkNamespaceExists = async (ns: string, useProjects: boolean): Promise<boolean> => {
  if (!ns) {
    return false;
  }
  if (ns === ALL_NAMESPACES_KEY) {
    return true;
  }
  try {
    await k8sGet(useProjects ? ProjectModel : NamespaceModel, ns);
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Error fetching namespace', e);
    return false;
  }
};
