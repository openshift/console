/* eslint-env node */

import { configure } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

import 'url-search-params-polyfill';

// http://airbnb.io/enzyme/docs/installation/index.html#working-with-react-16
configure({ adapter: new Adapter() });

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
