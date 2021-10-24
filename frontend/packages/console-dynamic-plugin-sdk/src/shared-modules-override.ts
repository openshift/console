/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-require-imports */

import { RemoteEntryModule } from './types';
import { safeRequire } from './utils/require';

/**
 * At runtime, Console will override (i.e. enforce Console-bundled implementation of) shared
 * modules for each dynamic plugin, before loading any of the modules exposed by that plugin.
 *
 * This way, a single version of React etc. is used by Console application and its plugins.
 */
export const overrideSharedModules = (entryModule: RemoteEntryModule) => {
  entryModule.override({
    '@openshift-console/dynamic-plugin-sdk': async () => () =>
      safeRequire('@console/dynamic-plugin-sdk/src/lib-core'),
    '@openshift-console/dynamic-plugin-sdk-internal': async () => () =>
      safeRequire('@console/dynamic-plugin-sdk/src/lib-internal'),
    '@openshift-console/dynamic-plugin-sdk-internal-kubevirt': async () => () =>
      safeRequire('@console/dynamic-plugin-sdk/src/lib-internal-kubevirt'),
    '@patternfly/react-core': async () => () => safeRequire('@patternfly/react-core'),
    '@patternfly/react-table': async () => () => safeRequire('@patternfly/react-table'),
    react: async () => () => safeRequire('react'),
    'react-helmet': async () => () => safeRequire('react-helmet'),
    'react-i18next': async () => () => safeRequire('react-i18next'),
    'react-router': async () => () => safeRequire('react-router'),
    'react-router-dom': async () => () => safeRequire('react-router-dom'),
  });
};
