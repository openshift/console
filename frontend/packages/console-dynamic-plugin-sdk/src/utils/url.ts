import * as _ from 'lodash';

/**
 * Resolve URL string using `base` and `to` URLs.
 *
 * If `base` is missing the protocol, it's considered to be relative to document origin.
 *
 * @param base Base URL.
 * @param to Target resource URL.
 * @param processURL Custom URL processing callback.
 */
export const resolveURL = (
  base: string,
  to: string,
  processURL: (url: URL) => URL = _.identity,
  getDocumentOrigin: () => string = _.constant(window.location.origin),
) => {
  const baseAbsoluteURL = base.indexOf('://') === -1 ? getDocumentOrigin() + base : base;
  return processURL(new URL(to, baseAbsoluteURL)).toString();
};
