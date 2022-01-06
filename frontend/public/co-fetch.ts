import * as _ from 'lodash';
import { HttpError, RetryError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { authSvc } from './module/auth';

// set required headers for console
const getCSRFToken = () => {
  const cookiePrefix = 'csrf-token=';
  return (
    document &&
    document.cookie &&
    document.cookie
      .split(';')
      .map((c) => _.trim(c))
      .filter((c) => c.startsWith(cookiePrefix))
      .map((c) => c.slice(cookiePrefix.length))
      .pop()
  );
};

export const applyConsoleHeaders = (url, options) => {
  if (options.method !== 'GET') {
    const token = getCSRFToken();
    if (options.headers) {
      options.headers['X-CSRFToken'] = token;
    } else {
      options.headers = { 'X-CSRFToken': token };
    }
  }

  // If the URL being requested is absolute (and therefore, not a local request),
  // remove the authorization header to prevent credentials from leaking.
  if (url.indexOf('://') >= 0) {
    delete options.headers.Authorization;
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

// export class RetryError extends Error {}

export const validateStatus = async (
  response: Response,
  url: string,
  method: string,
  retry: boolean,
) => {
  if (response.ok) {
    return response;
  }

  if (retry && response.status === 429) {
    throw new RetryError();
  }

  if (response.status === 401 && shouldLogout(url)) {
    authSvc.logout(window.location.pathname);
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

const initDefaults = {
  headers: {},
  credentials: 'same-origin',
};

export const appInternalFetch = async (url: string, options: RequestInit): Promise<Response> => {
  let attempt = 0;
  let response: Response;
  let retry = true;

  const op1 = applyConsoleHeaders(url, options);
  const allOptions = _.defaultsDeep({}, initDefaults, op1);

  while (retry) {
    retry = false;
    attempt++;
    try {
      response = await fetch(url, allOptions).then((resp) =>
        validateStatus(resp, url, allOptions.method, attempt < 3),
      );
    } catch (e) {
      if (e instanceof RetryError) {
        retry = true;
      } else {
        // eslint-disable-next-line no-console
        console.warn(`consoleFetch failed for url ${url}`, e);
        throw e;
      }
    }
  }
  return response;
};

export {
  consoleFetch as coFetch,
  consoleFetchJSON as coFetchJSON,
  consoleFetchText as coFetchText,
  getImpersonateHeaders,
} from '@console/dynamic-plugin-sdk/src/utils/fetch';
