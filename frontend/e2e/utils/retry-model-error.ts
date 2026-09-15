import type { Page } from '@playwright/test';

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
  }

  // eslint-disable-next-line no-restricted-syntax
  if (await errorLocator.isVisible().catch(() => false)) {
    throw new Error(`"Model does not exist" persisted after ${maxRetries} reload attempts`);
  }
}
