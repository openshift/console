type SharedModuleMetadata = Partial<{
  /**
   * If `true`, only a single version of the module can be loaded at runtime.
   *
   * @default true
   */
  singleton: boolean;

  /**
   * If `true`, plugins may provide their own fallback version of the module.
   *
   * The fallback module will be loaded when a matching module is not found within
   * the Console share scope object. If the given module is declared as singleton
   * and is already loaded, the fallback module will not load.
   *
   * @default false
   */
  allowFallback: boolean;
}>;

/**
 * Modules shared between the Console application and its dynamic plugins.
 */
export const sharedPluginModules = [
  '@openshift/dynamic-plugin-sdk',
  '@openshift-console/dynamic-plugin-sdk',
  '@openshift-console/dynamic-plugin-sdk-internal',
  '@patternfly/react-topology',
  'react',
  'react-i18next',
  'react-redux',
  'react-router',
  'react-router-dom',
  'react-router-dom-v5-compat',
  'redux',
  'redux-thunk',
] as const;

export type SharedModuleNames = typeof sharedPluginModules[number];

/**
 * Metadata associated with the shared modules.
 */
const sharedPluginModulesMetadata: Record<SharedModuleNames, SharedModuleMetadata> = {
  '@openshift/dynamic-plugin-sdk': {},
  '@openshift-console/dynamic-plugin-sdk': {},
  '@openshift-console/dynamic-plugin-sdk-internal': {},
  '@patternfly/react-topology': {},
  react: {},
  'react-i18next': {},
  'react-redux': {},
  'react-router': { singleton: false }, // fixes runtime error when both v5-compat and v5 are present
  'react-router-dom': {},
  'react-router-dom-v5-compat': {},
  redux: {},
  'redux-thunk': {},
};

/**
 * Retrieve full metadata for the given shared module.
 */
export const getSharedModuleMetadata = (
  moduleName: SharedModuleNames,
): Required<SharedModuleMetadata> => {
  const { singleton = true, allowFallback = false } = sharedPluginModulesMetadata[moduleName];
  return { singleton, allowFallback };
};
