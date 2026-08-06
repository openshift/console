import { getImpersonate } from '@console/dynamic-plugin-sdk/src/app/core/reducers';
import storeHandler from '@console/dynamic-plugin-sdk/src/app/storeHandler';
import type {
  ConsoleRequestHeaders,
  GetConsoleRequestHeaders,
  NormalizeConsoleHeaders,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';

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

export const getConsoleRequestHeaders: GetConsoleRequestHeaders = () => {
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

export const normalizeConsoleHeaders: NormalizeConsoleHeaders = (headers) => {
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

/**
 * A utility function to apply console-specific headers to the provided fetch options.
 * @returns Modified `options` object with additional request headers.
 */
export const applyConsoleHeaders = (url: string, options: RequestInit): RequestInit => {
  const consoleHeaders = getConsoleRequestHeaders();

  if (!options.headers) {
    options.headers = {};
  }

  // Apply console headers, handling array values for multiple headers
  Object.entries(consoleHeaders || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // For multiple Impersonate-Group headers, we need special handling
      // because fetch() API combines them into a single comma-separated header
      // which doesn't work for Kubernetes impersonation
      if (key === 'Impersonate-Group') {
        // Send as a special header that the backend will split
        options.headers['X-Console-Impersonate-Groups'] = value.join(',');
      } else {
        // For other array headers, store as array
        options.headers[key] = value;
      }
    } else if (value) {
      options.headers[key] = value;
    }
  });

  // X-CSRFToken is used only for non-GET requests targeting bridge
  if (options.method === 'GET' || url.indexOf('://') >= 0) {
    delete options.headers['X-CSRFToken'];
  }

  return options;
};
