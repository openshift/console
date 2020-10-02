/**
 * Resolve URL string using `base` and `to` URLs.
 *
 * Delegates to `new URL(to, base)` for the actual resolution.
 *
 * @param base Base URL.
 * @param to Target resource URL.
 * @param options Resolution options.
 */
export const resolveURL = (
  base: string,
  to: string,
  options: {
    trailingSlashInBaseURL: boolean;
  } = {
    trailingSlashInBaseURL: false,
  },
): string => {
  const from = options.trailingSlashInBaseURL && !base.endsWith('/') ? `${base}/` : base;
  return new URL(to, from).toString();
};
