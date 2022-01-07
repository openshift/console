import * as _ from 'lodash';
import 'whatwg-fetch';
import { ConsoleFetchText, ConsoleFetchJSON, ConsoleFetch } from '../../extensions/console-types';
import { TimeoutError, RetryError } from '../error/http-error';
import { getCSRFToken, validateStatus, getImpersonateHeaders } from './console-fetch-utils';

const initDefaults = {
  headers: {},
  credentials: 'same-origin',
};

const consoleFetchInternal = (
  url: string,
  options: RequestInit,
  timeout: number,
  retry: boolean,
): Promise<Response> => {
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

  const fetchPromise = fetch(url, allOptions).then((response) =>
    validateStatus(response, url, allOptions.method, retry),
  );

  // return fetch promise directly if timeout <= 0
  if (timeout < 1) {
    return fetchPromise;
  }

  const timeoutPromise: Promise<Response> = new Promise((unused, reject) =>
    setTimeout(() => reject(new TimeoutError(url, timeout)), timeout),
  );

  // Initiate both the fetch promise and a timeout promise
  return Promise.race([fetchPromise, timeoutPromise]);
};

/**
 * A custom wrapper around `fetch` that adds console specific headers and allows for retries and timeouts.
 * It also validates the response status code and throws appropriate error or logs out the user if required.
 * @param url The URL to fetch
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 * @return A promise that resolves to the response
 * * */
export const consoleFetch: ConsoleFetch = async (url, options = {}, timeout = 60000) => {
  let attempt = 0;
  let response;
  let retry = true;
  while (retry) {
    retry = false;
    attempt++;
    try {
      // have to disable for retry logic
      // eslint-disable-next-line no-await-in-loop
      response = await consoleFetchInternal(url, options, timeout, attempt < 3);
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

const consoleFetchCommon = async (
  url: string,
  method: string = 'GET',
  options: RequestInit = {},
  timeout?: number,
) => {
  const headers = getImpersonateHeaders() || {};
  // Pass headers last to let callers to override Accept.
  const allOptions = _.defaultsDeep({ method }, options, { headers });
  const response = await consoleFetch(url, allOptions, timeout);
  const text = await response.text();
  const isPlainText = response.headers.get('Content-Type') === 'text/plain';
  if (!text) {
    return isPlainText ? '' : {};
  }
  return isPlainText || !response.ok ? text : JSON.parse(text);
};

/**
 * A custom wrapper around `fetch` that adds console specific headers and allows for retries and timeouts.
 * It also validates the response status code and throws appropriate error or logs out the user if required.
 * It returns the response as a JSON object.
 * Uses consoleFetch internally.
 * @param url The URL to fetch
 * @param method  The HTTP method to use. Defaults to GET
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 * @returns A promise that resolves to the response as JSON object.
 * * */
export const consoleFetchJSON: ConsoleFetchJSON = (url, method = 'GET', options = {}, timeout) => {
  const allOptions = _.defaultsDeep({}, options, { headers: { Accept: 'application/json' } });
  return consoleFetchCommon(url, method, allOptions, timeout);
};

/**
 * A custom wrapper around `fetch` that adds console specific headers and allows for retries and timeouts.
 * It also validates the response status code and throws appropriate error or logs out the user if required.
 * It returns the response as a text.
 * Uses consoleFetch internally.
 * @param url The URL to fetch
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 * @returns A promise that resolves to the response as text.
 * * */
export const consoleFetchText: ConsoleFetchText = (url, options = {}, timeout) => {
  return consoleFetchCommon(url, 'GET', options, timeout);
};

const consoleFetchSendJSON = (
  url: string,
  method: string,
  json = null,
  options: RequestInit = {},
  timeout: number,
) => {
  const allOptions: Record<string, any> = {
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
  return consoleFetchJSON(url, method, _.defaultsDeep(allOptions, options), timeout);
};

/**
 * A custom DELETE method of consoleFetchJSON.
 * It sends an optional JSON object as the body of the request and adds extra headers for patch request.
 * @param url The URL to delete the object
 * @param json The JSON to delete the object
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 * * */
consoleFetchJSON.delete = (url, json = null, options = {}, timeout) => {
  return json
    ? consoleFetchSendJSON(url, 'DELETE', json, options, timeout)
    : consoleFetchJSON(url, 'DELETE', options, timeout);
};

/**
 * A custom POST method of consoleFetchJSON.
 * It sends the JSON object as the body of the request.
 * @param url The URL to post the object
 * @param json The JSON to POST the object
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 * * */
consoleFetchJSON.post = (url: string, json, options = {}, timeout) =>
  consoleFetchSendJSON(url, 'POST', json, options, timeout);

/**
 * A custom PUT method of consoleFetchJSON.
 * It sends the JSON object as the body of the request.
 * @param url The URL to put the object
 * @param json The JSON to PUT the object
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 * * */
consoleFetchJSON.put = (url: string, json, options = {}, timeout) =>
  consoleFetchSendJSON(url, 'PUT', json, options, timeout);

/**
 * A custom PATCH method of consoleFetchJSON.
 * It sends the JSON object as the body of the request.
 * @param url The URL to patch the object
 * @param json The JSON to PATCH the object
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 * * */
consoleFetchJSON.patch = (url: string, json, options = {}, timeout) =>
  consoleFetchSendJSON(url, 'PATCH', json, options, timeout);
