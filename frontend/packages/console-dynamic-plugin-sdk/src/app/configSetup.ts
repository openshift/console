export type ResourceFetch = (
  url: string,
  options?: RequestInit,
  retry?: boolean,
) => Promise<Response>;

export type UtilsConfig = {
  /**
   * Resource fetch implementation provided by the host application.
   *
   * Applications must validate the response before resolving the Promise.
   *
   * If the request cannot be completed successfully, the Promise should be rejected
   * with an appropriate error.
   */
  appFetch: ResourceFetch;
};

let config: UtilsConfig | undefined;

/**
 * Set the {@link UtilsConfig} reference.
 *
 * This must be done before using any of the Kubernetes utilities.
 */
export const setUtilsConfig = (c: UtilsConfig) => {
  if (config !== undefined) {
    throw new Error('setUtilsConfig has already been called');
  }

  config = c;
};

/**
 * Get the {@link UtilsConfig} reference.
 *
 * Throws an error if the reference isn't already set.
 */
export const getUtilsConfig = (): UtilsConfig => {
  if (config === undefined) {
    throw new Error('setUtilsConfig has not been called');
  }

  return config;
};
