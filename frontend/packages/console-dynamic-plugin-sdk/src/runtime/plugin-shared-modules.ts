// eslint-disable-next-line @typescript-eslint/triple-slash-reference, spaced-comment
/// <reference types="webpack/module" />

const SHARED_SCOPE_NAME = 'default';

/**
 * Initialize the webpack share scope object.
 *
 * Console application uses webpack `ModuleFederationPlugin` to declare shared modules
 * provided by Console to its plugins. Plugins may also add new modules to this share
 * scope object as part of their loading process.
 */
export const initSharedScope = async () => __webpack_init_sharing__(SHARED_SCOPE_NAME);

/**
 * webpack provided type of `__webpack_share_scopes__` object is incorrect; at runtime,
 * each shared module comes with one or more version(s) with each version scoped to its
 * own object, for example:
 *
 * ```js
 * {
 *   [SCOPE_NAME]: {
 *     'react': {
 *       '18.3.1': {
 *         from: 'openshift-console',
 *         eager: true,
 *         loaded: 1,
 *         get: moduleFactoryFunction,
 *       }
 *     }
 *   }
 * }
 * ```
 */
type WebpackShareScopes = {
  [scopeName: string]: {
    [moduleName: string]: {
      [moduleVersion: string]: typeof __webpack_share_scopes__[string][string];
    };
  };
};

/**
 * Get the webpack share scope object.
 */
export const getSharedScope = () => {
  if (!Object.keys(__webpack_share_scopes__).includes(SHARED_SCOPE_NAME)) {
    throw new Error('Attempt to access share scope object before its initialization');
  }

  // TODO: Remove this type cast once __webpack_share_scopes__ object type is fixed
  return (__webpack_share_scopes__[SHARED_SCOPE_NAME] as unknown) as WebpackShareScopes[string];
};

/**
 * Patch the webpack share scope object for backwards compatibility with existing plugins.
 *
 * - add `react-router-dom-v5-compat` module aliased to `react-router`
 * - add `react-router-dom` module aliased to `react-router`
 */
export const monkeyPatchSharedScope = (scope = getSharedScope()) => {
  scope['react-router-dom'] = scope['react-router'];
  scope['react-router-dom-v5-compat'] = scope['react-router'];
};
