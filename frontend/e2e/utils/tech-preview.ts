import type { Page } from '@playwright/test';

/**
 * Whether the console is serving Technology Preview features, read from the server flags the console
 * bootstraps with. The page must already have the console loaded.
 *
 * Several OLM surfaces differ between Technology Preview and a standard cluster: OLMv1
 * Operators only exist under Technology Preview, so the Software Catalog shows a single, generically
 * named Operators type everywhere else.
 */
export async function isTechPreview(page: Page): Promise<boolean> {
  return page.evaluate(() => Boolean(window.SERVER_FLAGS?.techPreview));
}
