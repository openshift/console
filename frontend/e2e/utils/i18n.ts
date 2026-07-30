import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

const PSEUDO_LOCALIZED_PATTERN = /\[[^a-zA-Z]+\]/;

async function isPseudoLocalized(text: string, context: string): Promise<void> {
  if (text.trim().length > 0) {
    expect(
      text,
      `Expected pseudolocalized text in ${context}, got: "${text}"`,
    ).toMatch(PSEUDO_LOCALIZED_PATTERN);
  }
}

export async function testI18n(
  page: Page,
  selectors: string[] = [],
  testIDs: string[] = [],
): Promise<void> {
  const originalUrl = page.url();
  const pseudoUrl = new URL(originalUrl);
  pseudoUrl.searchParams.set('pseudolocalization', 'true');
  pseudoUrl.searchParams.set('lng', 'en');

  // i18next-pseudo only activates when navigator.language matches the lng param.
  // Use an isolated browser context so the init script and navigation don't affect
  // the main test page's auth state or cookies.
  const browser = page.context().browser();
  if (!browser) {
    throw new Error('Browser disconnected, cannot create pseudo context for i18n check');
  }
  const pseudoContext = await browser.newContext({
    storageState: await page.context().storageState(),
    ignoreHTTPSErrors: true,
  });
  const pseudoPage = await pseudoContext.newPage();
  await pseudoPage.addInitScript(() => {
    Object.defineProperty(navigator, 'language', { value: 'en', configurable: true });
  });
  await pseudoPage.goto(pseudoUrl.toString(), { waitUntil: 'load' });
  await expect(pseudoPage.getByTestId('page-heading')).toBeVisible({ timeout: 30_000 });

  for (const testId of testIDs) {
    const elements = pseudoPage.getByTestId(testId);
    const count = await elements.count();
    for (let i = 0; i < count; i++) {
      const text = (await elements.nth(i).textContent()) ?? '';
      await isPseudoLocalized(text, `[data-test="${testId}"]`);
    }
  }

  for (const selector of selectors) {
    const elements = pseudoPage.locator(selector);
    const count = await elements.count();
    for (let i = 0; i < count; i++) {
      const el = elements.nth(i);
      const notTranslated = await el.getAttribute('i18n-not-translated');
      if (notTranslated !== null) {
        continue;
      }
      const text = (await el.textContent()) ?? '';
      await isPseudoLocalized(text, selector);
    }
  }

  await pseudoContext.close();
}
