import { getImpersonate } from '../../app/core/reducers';
import storeHandler from '../../app/storeHandler';

type ConsoleRequestHeaders = {
  'Impersonate-Group'?: string;
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

export const parseData = async (response) => {
  const text = await response.text();
  const isPlainText = response.headers.get('Content-Type') === 'text/plain';
  if (!text) {
    return isPlainText ? '' : {};
  }
  return isPlainText || !response.ok ? text : JSON.parse(text);
};

/**
 * This function takes a response object, waits for it to resolve,
 * converts the response to JSON, and then returns the data, headers, and status.
 * @param {Response} response - The response object to process.
 * @return {Promise<{ data: any, headers: Headers, status: number }>} - A promise that resolves to an object containing the data, headers, and status of the response.
 */
export const getResponseDetails = async (
  response: Response,
): Promise<{ data: any; headers: Headers; status: number }> => {
  const res = await response;
  const data = await parseData(res);
  const { headers } = res;
  const { status } = res;
  return { data, headers, status };
};
