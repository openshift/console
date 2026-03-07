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
 * Get the webpack share scope object.
 */
export const getSharedScope = () => {
  if (!Object.keys(__webpack_share_scopes__).includes(SHARED_SCOPE_NAME)) {
    throw new Error('Attempt to access share scope object before its initialization');
  }

  return __webpack_share_scopes__[SHARED_SCOPE_NAME];
};

/**
 * Patch the webpack share scope so that `react-router-dom-v5-compat` resolves to the
 * same shared module as `react-router-dom`.
 *
 * This ensures dynamic plugins built prior to 4.22 can still import from
 * `react-router-dom-v5-compat`, and receive the same module instance as `react-router-dom`.
 */
export const monkeyPatchSharedScope = () => {
  const scope = getSharedScope();
  scope['react-router-dom-v5-compat'] = scope['react-router-dom'];
};
