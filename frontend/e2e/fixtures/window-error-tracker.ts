import type { Page } from '@playwright/test';

/**
 * Asserts no errors from {@link window.windowError} were reported during the test,
 * which gets sourced from `window.onerror`, `window.onunhandledrejection`, and other
 * unhandled page errors
 *
 * If any errors were reported, throws an error with the list of errors.
 */
export const assertNoWindowErrors = async (page: Page) => {
  const windowError = await page.evaluate(() => window.windowError);
  if (windowError) {
    throw new Error(`Unhandled error(s) detected on the page:\n${windowError}`);
  }
};
