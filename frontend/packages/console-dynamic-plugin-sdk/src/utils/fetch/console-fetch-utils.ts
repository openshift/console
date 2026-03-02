import { getImpersonate } from '../../app/core/reducers';
import storeHandler from '../../app/storeHandler';
import { HttpError, RetryError } from '../error/http-error';

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

// TODO: url can be url or path, but shouldLogout only handles paths
export const shouldLogout = (url: string): boolean => {
  const k8sRegex = new RegExp(`^${window.SERVER_FLAGS.basePath}api/kubernetes/`);
  // 401 from k8s. show logout screen
  if (k8sRegex.test(url)) {
    // Don't let 401s from proxied services log out users
    const proxyRegex = new RegExp(`^${window.SERVER_FLAGS.basePath}api/kubernetes/api/v1/proxy/`);
    if (proxyRegex.test(url)) {
      return false;
    }
    const serviceRegex = new RegExp(
      `^${window.SERVER_FLAGS.basePath}api/kubernetes/api/v1/namespaces/\\w+/services/\\w+/proxy/`,
    );
    if (serviceRegex.test(url)) {
      return false;
    }
    return true;
  }
  return false;
};

export const validateStatus = async (
  response: Response,
  url: string,
  method: string,
  retry: boolean,
) => {
  if (response.ok || response.status === 304) {
    return response;
  }

  if (retry && response.status === 429) {
    throw new RetryError();
  }

  if (response.status === 401 && shouldLogout(url)) {
    const next = window.location.pathname + window.location.search + window.location.hash;
    // We can't use regular import from outside this package, so a dynamic import is required
    // This also breaks a nasty cycle - authSvc.logout calls coFetch (which calls validateStatus)
    import('@console/internal/module/auth')
      .then((m) => m.authSvc)
      .then((authSvc) => {
        authSvc.logout(next);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Error during logout after 401 response', e);
      });
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || contentType.indexOf('json') === -1) {
    throw new HttpError(response.statusText, response.status, response);
  }

  if (response.status === 403) {
    return response.json().then((json) => {
      throw new HttpError(
        json.message || 'Access denied due to cluster policy.',
        response.status,
        response,
        json,
      );
    });
  }

  return response.json().then((json) => {
    // retry 409 conflict errors due to ClustResourceQuota / ResourceQuota
    // https://bugzilla.redhat.com/show_bug.cgi?id=1920699
    if (
      retry &&
      method === 'POST' &&
      response.status === 409 &&
      ['resourcequotas', 'clusterresourcequotas'].includes(json.details?.kind)
    ) {
      throw new RetryError();
    }
    const cause = json.details?.causes?.[0];
    let reason;
    if (cause) {
      reason = `Error "${cause.message}" for field "${cause.field}".`;
    }
    if (!reason) {
      reason = json.message;
    }
    if (!reason) {
      reason = json.error;
    }
    if (!reason) {
      reason = response.statusText;
    }

    throw new HttpError(reason, response.status, response, json);
  });
};
