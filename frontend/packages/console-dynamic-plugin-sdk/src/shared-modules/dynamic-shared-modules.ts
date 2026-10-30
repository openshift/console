/**
 * Packages that support dynamic modules to be used with webpack module federation.
 *
 * Dynamic modules used by Console itself are added to the share scope object. Console plugins are
 * expected to reuse the existing dynamic modules within the share scope object, or contribute new
 * entries if the requested dynamic module or its version is missing.
 *
 * Each vendor package listed here should include a `dist/dynamic` directory along with an optional
 * `dist/dynamic-modules.json` dynamic module map.
 *
 * IMPORTANT: Console provided shared modules should _NOT_ be listed here.
 */
export const sharedDynamicModules = [
  '@patternfly/react-core',
  '@patternfly/react-data-view',
  '@patternfly/react-icons',
  '@patternfly/react-table',
  '@patternfly/react-templates',
];
