import * as _ from 'lodash';
import { getUtilsConfig } from '../../app/configSetup';
import { setAdmissionWebhookWarning } from '../../app/core/actions';
import storeHandler from '../../app/storeHandler';
import { ConsoleFetchText, ConsoleFetchJSON, ConsoleFetch } from '../../extensions/console-types';
import { TimeoutError } from '../error/http-error';
import { getConsoleRequestHeaders } from './console-fetch-utils';

/**
 * A custom wrapper around `fetch` that adds Console-specific headers and provides timeout functionality.
 *
 * This is the base fetch function used throughout the Console for all HTTP requests.
 * It provides consistent behavior for authentication, CSRF protection, and error handling.
 *
 * **Common use cases:**
 * - Making API requests to Kubernetes API server through Console proxy
 * - Fetching data from Console backend services
 * - Custom plugin API requests that need Console authentication
 *
 * **Features provided:**
 * - Automatic timeout handling with configurable duration
 * - Console-specific headers (CSRF, impersonation, etc.)
 * - Integration with Console's authentication system
 * - Error handling for common HTTP status codes
 *
 * **Timeout behavior:**
 * - Default timeout of 60 seconds for all requests
 * - Set timeout to 0 or negative value to disable timeout
 * - Throws TimeoutError when timeout is exceeded
 * - Uses Promise.race to implement timeout functionality
 *
 * **Edge cases:**
 * - Timeout of 0 or negative disables timeout completely
 * - May throw TimeoutError for slow network conditions
 * - Response validation is handled by higher-level wrapper functions
 *
 * @example
 * ```tsx
 * // Basic fetch with default timeout
 * const response = await consoleFetch('/api/kubernetes/api/v1/pods');
 * const pods = await response.json();
 * ```
 *
 * @example
 * ```tsx
 * // Custom timeout and options
 * const response = await consoleFetch(
 *   '/api/kubernetes/api/v1/nodes',
 *   {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(nodeData)
 *   },
 *   30000  // 30 second timeout
 * );
 * ```
 *
 * @param url The URL to fetch, can be relative or absolute
 * @param options Standard fetch options (method, headers, body, etc.)
 * @param timeout Timeout duration in milliseconds (default: 60000). Set to 0 to disable timeout
 * @returns Promise that resolves to the Response object or rejects with TimeoutError
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
  if (response.ok && warning && method !== 'GET') {
    // Do nothing on error since this is a side-effect. Caller will handle the error.
    dataPromise
      .then((data) => handleAdmissionWebhookWarning(warning, data.kind, data.metadata?.name))
      .catch(() => {});
  }

  return dataPromise;
};

/**
 * A wrapper around `consoleFetch` that automatically parses JSON responses and handles Console-specific behavior.
 *
 * This is the preferred method for making JSON API requests in Console plugins.
 * It automatically handles JSON parsing, error responses, and Console-specific features.
 *
 * **Common use cases:**
 * - API requests to Kubernetes API server
 * - Fetching configuration data from Console backend
 * - CRUD operations on Kubernetes resources
 * - Plugin API calls that expect JSON responses
 *
 * **Response handling:**
 * - Automatically sets Accept: application/json header
 * - Parses JSON responses automatically
 * - Handles empty responses gracefully
 * - Processes warning headers for admission webhook feedback
 *
 * **Error behavior:**
 * - Throws errors for HTTP error status codes
 * - Preserves original error information
 * - Handles network timeouts appropriately
 * - Logs admission webhook warnings to Redux store
 *
 * **Content type handling:**
 * - JSON responses are automatically parsed
 * - Plain text responses are returned as strings
 * - Empty responses return empty object or string based on content type
 *
 * @example
 * ```tsx
 * // GET request for resource list
 * const pods = await consoleFetchJSON('/api/kubernetes/api/v1/namespaces/default/pods');
 * console.log('Pod count:', pods.items.length);
 * ```
 *
 * @example
 * ```tsx
 * // POST request to create resource
 * const newPod = await consoleFetchJSON(
 *   '/api/kubernetes/api/v1/namespaces/default/pods',
 *   'POST',
 *   {
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(podDefinition)
 *   },
 *   30000  // 30 second timeout
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Error handling
 * try {
 *   const resource = await consoleFetchJSON('/api/kubernetes/api/v1/nonexistent');
 * } catch (error) {
 *   if (error.status === 404) {
 *     console.log('Resource not found');
 *   } else {
 *     console.error('API error:', error.message);
 *   }
 * }
 * ```
 *
 * @param url The URL to fetch, typically a Kubernetes API endpoint
 * @param method HTTP method to use (GET, POST, PUT, PATCH, DELETE). Defaults to GET
 * @param options Additional fetch options (headers, body, etc.)
 * @param timeout Timeout in milliseconds (default: 60000)
 * @returns Promise that resolves to parsed JSON response or string for plain text
 */
export const consoleFetchJSON: ConsoleFetchJSON = (url, method = 'GET', options = {}, timeout) => {
  const allOptions = _.defaultsDeep({}, options, {
    headers: { Accept: 'application/json' },
  });
  return consoleFetchCommon(url, method, allOptions, timeout);
};

/**
 * A wrapper around `consoleFetch` specifically for text responses.
 *
 * This function is optimized for fetching plain text content such as logs,
 * configuration files, or other non-JSON resources.
 *
 * **Common use cases:**
 * - Fetching container logs from Kubernetes API
 * - Downloading configuration files or manifests as text
 * - Retrieving plain text API responses
 * - Accessing raw content that shouldn't be JSON parsed
 *
 * **Response handling:**
 * - Always returns response as plain text
 * - Preserves original text formatting and encoding
 * - Handles empty responses appropriately
 * - No automatic JSON parsing unlike consoleFetchJSON
 *
 * **Use cases over consoleFetchJSON:**
 * - When you specifically need text content
 * - For responses that might not be valid JSON
 * - When dealing with large text files or logs
 * - For endpoints that return mixed content types
 *
 * @example
 * ```tsx
 * // Fetch container logs
 * const logs = await consoleFetchText(
 *   '/api/kubernetes/api/v1/namespaces/default/pods/my-pod/log?container=app'
 * );
 * console.log(logs);  // Raw log text
 * ```
 *
 * @example
 * ```tsx
 * // Fetch YAML manifest
 * const yaml = await consoleFetchText('/api/resources/manifest.yaml');
 * const parsedYaml = YAML.parse(yaml);
 * ```
 *
 * @example
 * ```tsx
 * // Fetch with custom timeout for large files
 * const configFile = await consoleFetchText(
 *   '/api/config/large-config.txt',
 *   { method: 'GET' },
 *   120000  // 2 minute timeout for large file
 * );
 * ```
 *
 * @param url The URL to fetch text content from
 * @param options Additional fetch options (headers, etc.)
 * @param timeout Timeout in milliseconds (default: 60000)
 * @returns Promise that resolves to the response as plain text
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
