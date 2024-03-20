import * as _ from 'lodash';
import 'whatwg-fetch';
import { getUtilsConfig } from '../../app/configSetup';
import { setAdmissionWebhookWarning } from '../../app/core/actions';
import storeHandler from '../../app/storeHandler';
import { ConsoleFetchText, ConsoleFetchJSON, ConsoleFetch } from '../../extensions/console-types';
import { TimeoutError } from '../error/http-error';
import { getConsoleRequestHeaders } from './console-fetch-utils';

/**
 * A custom wrapper around `fetch` that adds console-specific headers and allows for retries and timeouts.
 * It also validates the response status code and throws an appropriate error or logs out the user if required.
 * @param url The URL to fetch
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 * @returns A promise that resolves to the response.
 */
export const consoleFetch: ConsoleFetch = async (url, options = {}, timeout = 60000) => {
  const fetchPromise = getUtilsConfig().appFetch(url, options);

  if (timeout <= 0) {
    return fetchPromise;
  }

  const timeoutPromise = new Promise<Response>((resolve, reject) => {
    setTimeout(() => reject(new TimeoutError(url, timeout)), timeout);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
};

const parseData = async (response) => {
  const text = await response.text();
  const isPlainText = response.headers.get('Content-Type') === 'text/plain';
  if (!text) {
    return isPlainText ? '' : {};
  }
  return isPlainText || !response.ok ? text : JSON.parse(text);
};

const handleAdmissionWebhookWarning = (warning: string, kind?: string, name?: string) => {
  const store = storeHandler.getStore();
  const id = `${kind}_${name}_${warning}`;
  const warningData = { kind, name, warning };
  store.dispatch(setAdmissionWebhookWarning(id, warningData));
};

const consoleFetchCommon = async (
  url: string,
  method: string = 'GET',
  options: RequestInit = {},
  timeout?: number,
): Promise<Response | string> => {
  const headers = getConsoleRequestHeaders();
  // Pass headers last to let callers to override Accept.
  const allOptions = _.defaultsDeep({ method }, options, { headers });
  const response = await consoleFetch(url, allOptions, timeout);
  const dataPromise = parseData(response);
  const warning = response.headers.get('Warning');

  // If the response has a warning header, store it in the redux store.
  if (response.ok && warning) {
    // Do nothing on error since this is a side-effect. Caller will handle the error.
    dataPromise
      .then((data) => handleAdmissionWebhookWarning(warning, data.kind, data.metadata?.name))
      .catch(() => {});
  }

  return dataPromise;
};

/**
 * A custom wrapper around `fetch` that adds console-specific headers and allows for retries and timeouts.
 * It also validates the response status code and throws an appropriate error or logs out the user if required.
 * It returns the response as a JSON object.
 * Uses consoleFetch internally.
 * @param url The URL to fetch
 * @param method  The HTTP method to use. Defaults to GET
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 * @returns A promise that resolves to the response as text or JSON object.
 */
export const consoleFetchJSON: ConsoleFetchJSON = (url, method = 'GET', options = {}, timeout) => {
  const allOptions = _.defaultsDeep({}, options, {
    headers: { Accept: 'application/json' },
  });
  return consoleFetchCommon(url, method, allOptions, timeout);
};

/**
 * A custom wrapper around `fetch` that adds console-specific headers and allows for retries and timeouts.
 * It also validates the response status code and throws an appropriate error or logs out the user if required.
 * It returns the response as a text.
 * Uses `consoleFetch` internally.
 * @param url The URL to fetch
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 * @returns A promise that resolves to the response as text or JSON object.
 */
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
 */
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
 */
consoleFetchJSON.post = (url: string, json, options = {}, timeout) =>
  consoleFetchSendJSON(url, 'POST', json, options, timeout);

/**
 * A custom PUT method of consoleFetchJSON.
 * It sends the JSON object as the body of the request.
 * @param url The URL to put the object
 * @param json The JSON to PUT the object
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 */
consoleFetchJSON.put = (url: string, json, options = {}, timeout) =>
  consoleFetchSendJSON(url, 'PUT', json, options, timeout);

/**
 * A custom PATCH method of consoleFetchJSON.
 * It sends the JSON object as the body of the request.
 * @param url The URL to patch the object
 * @param json The JSON to PATCH the object
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 */
consoleFetchJSON.patch = (url: string, json, options = {}, timeout) =>
  consoleFetchSendJSON(url, 'PATCH', json, options, timeout);
