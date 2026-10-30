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

  /**
   * If `true`, this module's implementation is aliased to another module at runtime.
   *
   * Plugins should avoid using aliased modules due to risk of potential skew between
   * aliased vs actual module code.
   *
   * @default false
   */
  aliased: boolean;

  /**
   * A message describing the deprecation, if the module has been deprecated.
   *
   * @default false
   */
  deprecated: string | false;
}>;

/**
 * Shared modules provided by the Console application to its plugins.
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

type SharedModuleNames = (typeof sharedPluginModules)[number];

const sharedPluginModuleMetadata: Record<SharedModuleNames, SharedModuleMetadata> = {
  '@openshift/dynamic-plugin-sdk': {},
  '@openshift-console/dynamic-plugin-sdk': {},
  '@openshift-console/dynamic-plugin-sdk-internal': {},
  '@patternfly/react-topology': {},
  react: {},
  'react-i18next': {},
  'react-redux': {},
  'react-router': {},
  'react-router-dom': { aliased: true, deprecated: 'Use react-router instead.' },
  'react-router-dom-v5-compat': { aliased: true, deprecated: 'Use react-router instead.' },
  redux: {},
  'redux-thunk': {},
};

/**
 * Get metadata for the given shared module.
 */
export const getSharedModuleMetadata = (
  moduleName: SharedModuleNames,
): Required<SharedModuleMetadata> => {
  const {
    singleton = true,
    allowFallback = false,
    aliased = false,
    deprecated = false,
  } = sharedPluginModuleMetadata[moduleName];
  return { singleton, allowFallback, aliased, deprecated };
};
