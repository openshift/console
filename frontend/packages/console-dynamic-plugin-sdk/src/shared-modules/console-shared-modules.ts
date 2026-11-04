type SharedModuleMetadata = Partial<{
  /**
   * If `true`, only a single version of the module can be loaded at runtime.
   *
   * @see https://webpack.js.org/plugins/module-federation-plugin/#singleton
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
   * @see https://webpack.js.org/plugins/module-federation-plugin/#import
   *
   * @default false
   */
  allowFallback: boolean;

  /**
   * If not `false`, this module's required version will be determined from the given
   * package.
   *
   * @see https://webpack.js.org/plugins/module-federation-plugin/#packagename
   *
   * @default false
   */
  requiredVersionFrom: SharedModuleNames | false;

  /**
   * If `true`, this module's implementation is aliased to another module.
   *
   * Plugins should avoid using aliased modules due to risk of potential skew between
   * aliased vs actual module code.
   *
   * @default false
   */
  aliased: boolean;

  /**
   * If not `false`, this module's implementation is part of another module.
   *
   * For example, using `react-jsx` transform requires the `react/jsx-runtime` shared
   * module to be available at runtime.
   *
   * @default false
   */
  partOfModule: SharedModuleNames | false;

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
  'react-dom',
  'react/jsx-runtime',
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
  'react-dom': { requiredVersionFrom: 'react' },
  'react/jsx-runtime': { partOfModule: 'react' },
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
    requiredVersionFrom = false,
    aliased = false,
    partOfModule = false,
    deprecated = false,
  } = sharedPluginModuleMetadata[moduleName];

  return {
    singleton,
    allowFallback,
    requiredVersionFrom,
    aliased,
    partOfModule,
    deprecated,
  };
};
