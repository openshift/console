import { getImpersonate } from '../../app/core/reducers';
import storeHandler from '../../app/storeHandler';

type ConsoleRequestHeaders = {
  'Impersonate-Group'?: string | string[];
  'Impersonate-User'?: string;
  'X-CSRFToken'?: string;
};

export const getCSRFToken = () => {
  const cookiePrefix = 'csrf-token=';
  return (
    document &&
    document.cookie &&
    document.cookie
      .split(';')
      .map((c) => c.trim())
      .filter((c) => c.startsWith(cookiePrefix))
      .map((c) => c.slice(cookiePrefix.length))
      .pop()
  );
};

/**
 * A function that creates impersonation headers for API requests using current redux state.
 * @returns an object containing the appropriate impersonation requst headers, based on redux state
 */
export const getConsoleRequestHeaders = (): ConsoleRequestHeaders => {
  const store = storeHandler.getStore();
  if (!store) return undefined;
  const state = store.getState();

  const headers: ConsoleRequestHeaders = {
    'X-CSRFToken': getCSRFToken(),
  };

  // Set impersonation headers
  const impersonateData = getImpersonate(state);
  if (impersonateData) {
    const { kind, name, groups } = impersonateData;

    if (kind === 'User' && name) {
      // Simple user impersonation
      headers['Impersonate-User'] = name;
    } else if (kind === 'Group' && name) {
      // Single group impersonation (backward compatibility)
      // Even if we are impersonating a group, we still need to set Impersonate-User to something or k8s will complain
      headers['Impersonate-User'] = name;
      headers['Impersonate-Group'] = name;
    } else if (kind === 'UserWithGroups' && name && groups && groups.length > 0) {
      // User with multiple groups impersonation
      headers['Impersonate-User'] = name;
      // Set multiple Impersonate-Group headers - one for each group
      headers['Impersonate-Group'] = groups;
    }
  }

  return headers;
};
