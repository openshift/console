import { safeLoad } from 'js-yaml';
import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/lib-core';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';

export const API_PROXY_URL = '/api/dev-console/proxy/internet';

type ProxyRequest = {
  allowInsecure?: boolean;
  method: string;
  url: string;
  headers?: Record<string, string[]>;
  queryparams?: Record<string, string[]>;
  body?: string;
};

export type ProxyResponse = {
  statusCode: number;
  headers: Record<string, string[]>;
  body: string;
};

const isJSONString = (str: string): boolean => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export const convertHeaders = (headers): Record<string, string[]> => {
  return Object.keys(headers).reduce((output, key) => {
    output[key] = [headers[key]];
    return output;
  }, {});
};

/**
 * Calls the proxy in our backend to bypass CORS headers.
 */
export const consoleProxyFetch = async (proxyRequest: ProxyRequest): Promise<ProxyResponse> => {
  const proxyResponse: ProxyResponse = await consoleFetchJSON.post(API_PROXY_URL, proxyRequest);
  if (!proxyResponse.statusCode) {
    throw new Error('Unexpected proxy response: Status code is missing!');
  }
  if (proxyResponse.statusCode < 200 || proxyResponse.statusCode >= 300) {
    throw new HttpError(
      `Unexpected status code: ${proxyResponse.statusCode}`,
      proxyResponse.statusCode,
      null,
      proxyResponse,
    );
  }
  return proxyResponse;
};

export const consoleProxyFetchJSON = <T>(proxyRequest: ProxyRequest): Promise<T> => {
  return consoleProxyFetch(proxyRequest).then((response) => {
    return isJSONString(response.body) ? JSON.parse(response.body) : safeLoad(response.body);
  });
};
