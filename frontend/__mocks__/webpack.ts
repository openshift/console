/* eslint-disable camelcase */
/* global __webpack_share_scopes__, __webpack_init_sharing__ */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference, spaced-comment
/// <reference types="webpack/module" />

const mockShareScopes: typeof __webpack_share_scopes__ = {
  default: {},
};

const mockInitSharing: typeof __webpack_init_sharing__ = jest.fn(() => Promise.resolve());

// @ts-expect-error - __webpack_share_scopes__ should be typed as 'declare var' instead of 'declare const'
global.__webpack_share_scopes__ = mockShareScopes;
global.__webpack_init_sharing__ = mockInitSharing;
