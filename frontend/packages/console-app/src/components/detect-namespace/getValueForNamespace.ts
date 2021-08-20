import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { checkNamespaceExists } from './checkNamespaceExists';

export const getValueForNamespace = async (
  useProjects?: boolean,
  urlNamespace?: string,
  activeNamespace?: string,
  preferredNamespace?: string,
  lastNamespace?: string,
): Promise<string> => {
  if (urlNamespace) {
    if (await checkNamespaceExists(urlNamespace, useProjects)) {
      return urlNamespace;
    }
  }

  if (activeNamespace) {
    if (await checkNamespaceExists(activeNamespace, useProjects)) {
      return activeNamespace;
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
