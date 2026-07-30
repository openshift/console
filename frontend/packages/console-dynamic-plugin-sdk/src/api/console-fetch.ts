/* eslint-disable @typescript-eslint/no-require-imports */
import type { ConsoleFetch, ConsoleFetchJSON, ConsoleFetchText } from '../extensions/console-types';

/**
 * A custom wrapper around `fetch` that adds console-specific headers and allows for retries and timeouts.
 * It also validates the response status code and throws an appropriate error or logs out the user if required.
 * @param url - The URL to fetch
 * @param options - The options to pass to fetch
 * @param timeout - The timeout in milliseconds
 * @returns A promise that resolves to the response.
 * @throws {@link HttpError} when the response status code indicates an error
 */
export const consoleFetch: ConsoleFetch = require('@console/shared/src/utils/console-fetch')
  .coFetch;

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
 * @throws {@link HttpError} when the response status code indicates an error
 */
export const consoleFetchJSON: ConsoleFetchJSON = require('@console/shared/src/utils/console-fetch')
  .coFetchJSON;

/**
 * A custom wrapper around `fetch` that adds console-specific headers and allows for retries and timeouts.
 * It also validates the response status code and throws an appropriate error or logs out the user if required.
 * It returns the response as a text.
 * Uses `consoleFetch` internally.
 * @param url The URL to fetch
 * @param options The options to pass to fetch
 * @param timeout The timeout in milliseconds
 * @returns A promise that resolves to the response as text or JSON object.
 * @throws {@link HttpError} when the response status code indicates an error
 */
export const consoleFetchText: ConsoleFetchText = require('@console/shared/src/utils/console-fetch')
  .coFetchText;
