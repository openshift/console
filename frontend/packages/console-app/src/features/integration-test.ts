import type { FeatureFlagHandler } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { FLAG_INTEGRATION_TEST } from '../consts';

const INTEGRATION_TEST_USER_AGENT = 'ConsoleIntegrationTestEnvironment';

/**
 * Detect Cypress via a custom user agent we set in `cypress.config.js` in
 * each cypress run configuration.
 *
 * This is used to disable certain features during integration tests to
 * increase test reliability.
 */
export const handler: FeatureFlagHandler = (callback) => {
  const userAgent = window.navigator.userAgent ?? '';

  // No need to watch this as user agent cannot change during a session
  callback(FLAG_INTEGRATION_TEST, userAgent === INTEGRATION_TEST_USER_AGENT);
};
