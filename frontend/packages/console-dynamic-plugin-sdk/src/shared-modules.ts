/**
 * Dynamic plugin SDK modules provided by Console application at runtime.
 */
const pluginSDKModules = [
  '@openshift-console/dynamic-plugin-sdk',
  '@openshift-console/dynamic-plugin-sdk-internal',
];

/**
 * Get modules shared between Console application and its dynamic plugins.
 */
export const getSharedPluginModules = (includePluginSDK = true) =>
  ['react', 'react-helmet', 'react-i18next', 'react-router-dom', 'react-router'].concat(
    includePluginSDK ? pluginSDKModules : [],
  );
