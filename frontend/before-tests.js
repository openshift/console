/* eslint-env node */

import { URLSearchParams } from 'url';
import fetch, { Headers } from 'node-fetch';

// FIXME: Remove when jest is updated to at least 25.1.0 -- see https://github.com/jsdom/jsdom/issues/1555
if (!Element.prototype.closest) {
  Element.prototype.closest = function (this, selector) {
    // eslint-disable-next-line consistent-this
    let el = this;
    while (el) {
      if (el.matches(selector)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };
}
if (!Element.prototype.getRootNode) {
  Object.defineProperty(Element.prototype, 'getRootNode', {
    value: function () {
      // eslint-disable-next-line consistent-this
      let rootNode = this;
      while (rootNode.parentNode) {
        rootNode = rootNode.parentNode;
      }
      return rootNode;
    },
    writable: true,
  });
}
// FIXME: Remove when jest is updated to at least 25
if (!window.Headers) {
  Object.defineProperty(window, 'Headers', {
    value: Headers,
    writable: true,
  });
}
// FIXME: Remove when jest is updated to at least 22
if (!window.URLSearchParams) {
  Object.defineProperty(window, 'URLSearchParams', {
    value: URLSearchParams,
    writable: true,
  });
}
if (!window.fetch) {
  Object.defineProperty(window, 'fetch', {
    value: fetch,
    writable: true,
  });
}

/**
 * Since Node.js 15 all unhandled promise rejections triggers a `unhandledRejection`
 * runtime event. If this event is not handled the process is automatically terminated.
 * We ignore this event when running the jest watch mode,
 * otherwise we'll log some infos and stop the tests with the same error code (1).
 */
if (process.argv.includes('--watch')) {
  // jest loads this file again and again (in watch mode when chaning source code or tests),
  // so that we need to drop our own listener here before adding a new one
  process.listeners('unhandledRejection').forEach((listener) => {
    if (listener.name === 'beforeTestsUnhandledRejectionHandler') {
      process.removeListener('unhandledRejection', listener);
    }
  });

  process.on('unhandledRejection', function beforeTestsUnhandledRejectionHandler(reason, promise) {
    // eslint-disable-next-line no-console
    console.error(
      'Unhandled promise rejections in unit test. This test will fail when watch mode is not active anymore!',
      reason,
      promise,
    );
  });
}
