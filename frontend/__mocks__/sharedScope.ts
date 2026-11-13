/* eslint-disable camelcase */
/* global __webpack_share_scopes__, __webpack_init_sharing__ */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference, spaced-comment
/// <reference types="@rspack/core/module" />

import type { getSharedScope } from '../packages/console-dynamic-plugin-sdk/src/runtime/plugin-shared-modules';

// Console's plugin initialization aliases react-router in the default share scope.
const mockDefaultScope: ReturnType<typeof getSharedScope> = {
  'react-router': {
    '0.0.0': {
      from: 'openshift-console',
      eager: true,
      loaded: 1,
      get: jest.fn(async () => () => ({})),
    },
  },
};

// The bundler declaration omits the version level present in the runtime scope.
const mockShareScopes = { default: mockDefaultScope } as unknown as typeof __webpack_share_scopes__;

const mockInitSharing: typeof __webpack_init_sharing__ = jest.fn(() => Promise.resolve());

// @ts-expect-error - __webpack_share_scopes__ should be typed as 'declare var' instead of 'declare const'
global.__webpack_share_scopes__ = mockShareScopes;
global.__webpack_init_sharing__ = mockInitSharing;
