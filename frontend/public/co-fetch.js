import * as _ from 'lodash-es';
import 'whatwg-fetch';

import { authSvc } from './module/auth';
import store from './redux';

const initDefaults = {
  headers: {},
  credentials: 'same-origin',
};

// TODO: url can be url or path, but shouldLogout only handles paths
export const shouldLogout = (url) => {
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

const validateStatus = (response, url) => {
  if (response.ok) {
    return response;
  }

  if (response.status === 401 && shouldLogout(url)) {
    authSvc.logout(window.location.pathname);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || contentType.indexOf('json') === -1) {
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  }

  if (response.status === 403) {
    return response.json().then((json) => {
      const error = new Error(json.message || 'Access denied due to cluster policy.');
      error.response = response;
      error.json = json;
      throw error;
    });
  }

  return response.json().then((json) => {
    const cause = _.get(json, 'details.causes[0]');
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
    const error = new Error(reason);
    error.response = response;
    error.json = json;
    throw error;
  });
};

export class TimeoutError extends Error {
  constructor(url, ms, ...params) {
    super(`Call to ${url} timed out after ${ms}ms.`, ...params);
    // Dumb hack to fix `instanceof TimeoutError`
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

const cookiePrefix = 'csrf-token=';
const getCSRFToken = () =>
  document &&
  document.cookie &&
  document.cookie
    .split(';')
    .map((c) => _.trim(c))
    .filter((c) => c.startsWith(cookiePrefix))
    .map((c) => c.slice(cookiePrefix.length))
    .pop();

export const coFetch = (url, options = {}, timeout = 60000) => {
  const allOptions = _.defaultsDeep({}, initDefaults, options);
  if (allOptions.method !== 'GET') {
    allOptions.headers['X-CSRFToken'] = getCSRFToken();
  }

  // If the URL being requested is absolute (and therefore, not a local request),
  // remove the authorization header to prevent credentials from leaking.
  if (url.indexOf('://') >= 0) {
    delete allOptions.headers.Authorization;
    delete allOptions.headers['X-CSRFToken'];
  }

  const fetchPromise = fetch(url, allOptions).then((response) => validateStatus(response, url));

  // return fetch promise directly if timeout <= 0
  if (timeout < 1) {
    return fetchPromise;
  }

  const timeoutPromise = new Promise((unused, reject) =>
    setTimeout(() => reject(new TimeoutError(url, timeout)), timeout),
  );

  // Initiate both the fetch promise and a timeout promise
  return Promise.race([fetchPromise, timeoutPromise]);
};

const parseJson = (response) => response.json();

export const coFetchUtils = {
  parseJson,
};

export const getImpersonateHeaders = () => {
  const { kind, name } = store.getState().UI.get('impersonate', {});
  if ((kind === 'User' || kind === 'Group') && name) {
    // Even if we are impersonating a group, we still need to set Impersonate-User to something or k8s will complain
    const headers = {
      'Impersonate-User': name,
    };
    if (kind === 'Group') {
      headers['Impersonate-Group'] = name;
    }
    return headers;
  }
};

export const coFetchCommon = (url, method = 'GET', options = {}, timeout) => {
  const headers = getImpersonateHeaders() || {};
  // Pass headers last to let callers to override Accept.
  const allOptions = _.defaultsDeep({ method }, options, { headers });
  return coFetch(url, allOptions, timeout).then((response) => {
    if (!response.ok) {
      return response.text();
    }

    // If the response has no body, return promise that resolves with an empty object
    if (response.headers.get('Content-Length') === '0') {
      return Promise.resolve(response.headers.get('Content-Type') === 'text/plain' ? '' : {});
    }
    if (response.headers.get('Content-Type') === 'text/plain') {
      return response.text();
    }
    return response.json();
  });
};

export const coFetchJSON = (url, method = 'GET', options = {}, timeout) => {
  const allOptions = _.defaultsDeep({}, options, { headers: { Accept: 'application/json' } });
  return coFetchCommon(url, method, allOptions, timeout);
};

export const coFetchText = (url, options = {}, timeout) => {
  return coFetchCommon(url, 'GET', options, timeout);
};

const coFetchSendJSON = (url, method, json = null, options = {}, timeout) => {
  const allOptions = {
    headers: {
      Accept: 'application/json',
      'Content-Type': `application/${
        method === 'PATCH' ? 'json-patch+json' : 'json'
      };charset=UTF-8`,
    },
  };
  if (json) {
    allOptions.body = JSON.stringify(json);
  }
  return coFetchJSON(url, method, _.defaultsDeep(allOptions, options), timeout);
};

coFetchJSON.delete = (url, options = {}, json = null, timeout) => {
  return json
    ? coFetchSendJSON(url, 'DELETE', json, options, timeout)
    : coFetchJSON(url, 'DELETE', options, timeout);
};
coFetchJSON.post = (url, json, options = {}, timeout) =>
  coFetchSendJSON(url, 'POST', json, options, timeout);
coFetchJSON.put = (url, json, options = {}, timeout) =>
  coFetchSendJSON(url, 'PUT', json, options, timeout);
coFetchJSON.patch = (url, json, options = {}, timeout) =>
  coFetchSendJSON(url, 'PATCH', json, options, timeout);
