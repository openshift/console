import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { checkNamespaceExists } from './checkNamespaceExists';

export const getValueForNamespace = async (
  useProjects?: boolean,
  fallbackNamespace?: string,
  preferredNamespace?: string,
  lastNamespace?: string,
): Promise<string> => {
  if (fallbackNamespace) {
    if (await checkNamespaceExists(fallbackNamespace, useProjects)) {
      return fallbackNamespace;
    }
  }

  if (preferredNamespace) {
    if (await checkNamespaceExists(preferredNamespace, useProjects)) {
      return preferredNamespace;
    }
  }

  if (lastNamespace) {
    if (await checkNamespaceExists(lastNamespace, useProjects)) {
      return lastNamespace;
    }
  }

  return ALL_NAMESPACES_KEY;
};
