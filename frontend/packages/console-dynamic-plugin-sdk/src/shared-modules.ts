type SharedModuleMetadata = Partial<{
  /**
   * If `true`, only a single version of the module can be loaded at runtime.
   *
   * @default false
   */
  singleton: boolean;

  /**
   * If `true`, plugins will provide their own fallback version of the module.
   *
   * The fallback module will be loaded when a matching module is not found within
   * the Console shared scope object. If the given module is declared as singleton
   * and is already loaded, the fallback module will not load.
   *
   * @default true
   */
  allowFallback: boolean;
}>;

/**
 * Modules shared between the Console application and its dynamic plugins.
 */
export const sharedPluginModules = [
  '@openshift-console/dynamic-plugin-sdk',
  '@openshift-console/dynamic-plugin-sdk-internal',
  '@patternfly/react-core',
  '@patternfly/react-table',
  '@patternfly/quickstarts',
  'react',
  'react-i18next',
  'react-router',
  'react-router-dom',
  'react-router-dom-v5-compat',
  'react-redux',
  'redux',
  'redux-thunk',
] as const;

export type SharedModuleNames = typeof sharedPluginModules[number];

/**
 * Metadata associated with the shared modules.
 */
const sharedPluginModulesMetadata: Record<SharedModuleNames, SharedModuleMetadata> = {
  '@openshift-console/dynamic-plugin-sdk': { singleton: true, allowFallback: false },
  '@openshift-console/dynamic-plugin-sdk-internal': { singleton: true, allowFallback: false },
  '@patternfly/react-core': {},
  '@patternfly/react-table': {},
  '@patternfly/quickstarts': {},
  react: { singleton: true, allowFallback: false },
  'react-i18next': { singleton: true, allowFallback: false },
  'react-router': { singleton: true, allowFallback: false },
  'react-router-dom': { singleton: true, allowFallback: false },
  'react-router-dom-v5-compat': { singleton: true, allowFallback: false },
  'react-redux': { singleton: true, allowFallback: false },
  redux: { singleton: true, allowFallback: false },
  'redux-thunk': { singleton: true, allowFallback: false },
};

/**
 * Retrieve full metadata for the given shared module.
 */
export const getSharedModuleMetadata = (
  moduleName: SharedModuleNames,
): Required<SharedModuleMetadata> => {
  const { singleton = false, allowFallback = true } = sharedPluginModulesMetadata[moduleName];
  return { singleton, allowFallback };
};
