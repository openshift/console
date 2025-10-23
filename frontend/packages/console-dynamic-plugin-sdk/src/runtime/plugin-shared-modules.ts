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
