import * as _ from 'lodash';
import { setAdmissionWebhookWarning } from '@console/dynamic-plugin-sdk/src/app/core/actions/core';
import storeHandler from '@console/dynamic-plugin-sdk/src/app/storeHandler';
import type {
  ConsoleFetchJSON,
  ConsoleFetchText,
  ConsoleFetch,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { RetryError, TimeoutError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import {
  applyConsoleHeaders,
  getConsoleRequestHeaders,
  normalizeConsoleHeaders,
  validateStatus,
} from './console-fetch-utils';

const defaultRequestOptions: RequestInit = {
  headers: {},
  credentials: 'same-origin',
};

export const coFetch: ConsoleFetch = async (url, options = {}, timeout = 60000) => {
  const op1 = applyConsoleHeaders(url, options);
  const allOptions = _.defaultsDeep({}, defaultRequestOptions, op1);

  const fetchPromise = async () => {
    let res: Response;
    let attempt = 0;
    let retry = true;

    while (retry) {
      retry = false;
      attempt++;
      try {
        // eslint-disable-next-line no-await-in-loop, no-loop-func
        res = await fetch(url, allOptions).then((resp) =>
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
    return res;
  };

  if (timeout <= 0) {
    return fetchPromise();
  }

  const timeoutPromise = new Promise<Response>((_resolve, reject) => {
    setTimeout(() => reject(new TimeoutError(url, timeout)), timeout);
  });

  return Promise.race([fetchPromise(), timeoutPromise]);
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
  const id = `${kind}_${name}_${warning}`;
  const warningData = { kind, name, warning };
  storeHandler.getStore()?.dispatch(setAdmissionWebhookWarning(id, warningData));
};

const coFetchCommon = async (
  url: string,
  method: string = 'GET',
  options: RequestInit = {},
  timeout?: number,
): Promise<Response | string> => {
  const consoleHeaders = getConsoleRequestHeaders();
  const normalizedConsoleHeaders = normalizeConsoleHeaders(consoleHeaders);

  // Merge headers properly - console headers first, then let options override
  const mergedHeaders = { ...normalizedConsoleHeaders, ...options.headers };
  const allOptions = _.defaultsDeep({ method, headers: mergedHeaders }, options);

  const response = await coFetch(url, allOptions, timeout);
  const dataPromise = parseData(response);
  const warning = response.headers.get('Warning');

  // If the response has a warning header, store it in the redux store.
  if (response.ok && warning && method !== 'GET') {
    // Do nothing on error since this is a side-effect. Caller will handle the error.
    dataPromise
      .then((data) => handleAdmissionWebhookWarning(warning, data.kind, data.metadata?.name))
      .catch(() => {});
  }

  return dataPromise;
};

export const coFetchJSON: ConsoleFetchJSON = (url, method = 'GET', options = {}, timeout) => {
  const allOptions = _.defaultsDeep({}, options, {
    headers: { Accept: 'application/json' },
  });
  return coFetchCommon(url, method, allOptions, timeout);
};

export const coFetchText: ConsoleFetchText = (url, options = {}, timeout) => {
  return coFetchCommon(url, 'GET', options, timeout);
};

const coFetchSendJSON = (
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

  return coFetchJSON(url, method, _.defaultsDeep(allOptions, options), timeout);
};

coFetchJSON.delete = (url, json = null, options = {}, timeout) => {
  return json
    ? coFetchSendJSON(url, 'DELETE', json, options, timeout)
    : coFetchJSON(url, 'DELETE', options, timeout);
};

coFetchJSON.post = (url: string, json, options = {}, timeout) =>
  coFetchSendJSON(url, 'POST', json, options, timeout);

coFetchJSON.put = (url: string, json, options = {}, timeout) =>
  coFetchSendJSON(url, 'PUT', json, options, timeout);

coFetchJSON.patch = (url: string, json, options = {}, timeout) =>
  coFetchSendJSON(url, 'PATCH', json, options, timeout);
