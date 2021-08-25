/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-require-imports */
import { RemoteEntryModule } from './types';

/**
 * Vendor modules shared between Console application and its dynamic plugins.
 */
export const sharedVendorModules = [
  'react',
  'react-helmet',
  'react-i18next',
  'react-router',
  'react-router-dom',
];

/**
 * At runtime, Console will override (i.e. enforce Console-bundled implementation of) shared
 * modules for each dynamic plugin, before loading any of the modules exposed by that plugin.
 *
 * This way, a single version of React etc. is used by the Console application.
 */
export const overrideSharedModules = (entryModule: RemoteEntryModule) => {
  entryModule.override({
    react: async () => () => require('react'),
    'react-helmet': async () => () => require('react-helmet'),
    'react-i18next': async () => () => require('react-i18next'),
    'react-router': async () => () => require('react-router'),
    'react-router-dom': async () => () => require('react-router-dom'),
  });
};
