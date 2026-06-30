import type { Page } from '@playwright/test';

/**
 * Retry page reload when the console shows "Model does not exist" error.
 * This transient error occurs when navigating to a resource page before
 * all CRD models have been registered by the backend.
 */
export async function retryOnModelNotFound(page: Page, maxRetries = 3): Promise<void> {
  const errorLocator = page.getByText('Model does not exist');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // eslint-disable-next-line no-restricted-syntax
      await errorLocator.waitFor({ state: 'visible', timeout: 5_000 });
    } catch {
      return;
    }
    await page.reload({ waitUntil: 'load' });
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(3_000);
  }
}
