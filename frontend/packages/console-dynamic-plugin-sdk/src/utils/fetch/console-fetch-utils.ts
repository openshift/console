import { getImpersonate, getActiveCluster } from '../../app/core/reducers';
import storeHandler from '../../app/storeHandler';

type ConsoleRequestHeaders = {
  'Impersonate-Group'?: string;
  'Impersonate-User'?: string;
  'X-Cluster'?: string;
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
 * A function that creates impersonation- and multicluster-related headers for API requests using current redux state.
 * @param targetCluster override the current active cluster with the provided targetCluster
 * @returns An object containing the appropriate impersonation and clustr requst headers, based on redux state.
 */
export const getConsoleRequestHeaders = (targetCluster?: string): ConsoleRequestHeaders => {
  const store = storeHandler.getStore();
  if (!store) return undefined;
  const state = store.getState();

  // TODO remove multicluster
  const cluster = getActiveCluster(state);
  const headers: ConsoleRequestHeaders = {
    'X-Cluster': targetCluster ?? cluster,
    'X-CSRFToken': getCSRFToken(),
  };

  // Set impersonation headers
  const { kind, name } = getImpersonate(state) || {};
  if ((kind === 'User' || kind === 'Group') && name) {
    // Even if we are impersonating a group, we still need to set Impersonate-User to something or k8s will complain
    headers['Impersonate-User'] = name;
    if (kind === 'Group') {
      headers['Impersonate-Group'] = name;
    }
  }

  return headers;
};
