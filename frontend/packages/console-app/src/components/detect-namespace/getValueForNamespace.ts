import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { checkNamespaceExists } from './checkNamespaceExists';

export const getValueForNamespace = async (
  preferredNamespace: string,
  lastNamespace: string,
  useProjects: boolean,
): Promise<string> => {
  if (await checkNamespaceExists(preferredNamespace, useProjects)) {
    return preferredNamespace;
  }
  if (await checkNamespaceExists(lastNamespace, useProjects)) {
    return lastNamespace;
  }
  return ALL_NAMESPACES_KEY;
};
