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
      // Note: This creates an array of values for the same header key
      headers['Impersonate-Group'] = groups;
    }
  }

  return headers;
};

/**
 * Normalizes console headers to be compatible with fetch API's HeadersInit.
 * Converts array values (like Impersonate-Group) to a format that fetch() accepts.
 * @param headers - Headers object that may contain array values
 * @returns Normalized headers object with only string values
 */
export const normalizeConsoleHeaders = (
  headers: Record<string, string | string[] | undefined>,
): Record<string, string> => {
  const normalized: Record<string, string> = {};

  Object.entries(headers || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // For multiple Impersonate-Group headers, we need special handling
      // because fetch() API combines them into a single comma-separated header
      // which doesn't work for Kubernetes impersonation
      if (key === 'Impersonate-Group') {
        // Send as a special header that the backend will split
        normalized['X-Console-Impersonate-Groups'] = value.join(',');
      }
      // Skip other array values as they're not supported by fetch HeadersInit
    } else if (value) {
      normalized[key] = value;
    }
  });

  return normalized;
};
