import { getImpersonate, getActiveCluster } from '../../app/core/reducers';
import storeHandler from '../../app/storeHandler';

type ConsoleRequestHeaders = {
  'Impersonate-Group'?: string;
  'Impersonate-User'?: string;
  'X-Cluster'?: string;
};

/**
 * A function that creates impersonation and multicluster related headers for API requests using current redux state.
 * @param targetCluster override the current active cluster with the provided targetCluster
 * @returns an object containing the appropriate impersonation and clustr requst headers, based on redux state
 */
export const getConsoleRequestHeaders = (targetCluster?: string): ConsoleRequestHeaders => {
  const store = storeHandler.getStore();
  if (!store) return undefined;
  const state = store.getState();

  // Set X-Cluster header
  const cluster = getActiveCluster(state);
  const headers: ConsoleRequestHeaders = {
    'X-Cluster': targetCluster ?? cluster,
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
