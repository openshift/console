import {
  ConsoleRequestHeaders,
  GetConsoleRequestHeaders,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { getImpersonate } from '../../app/core/reducers';
import storeHandler from '../../app/storeHandler';

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
