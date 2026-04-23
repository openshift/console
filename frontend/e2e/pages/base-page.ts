import type { Locator, Page } from '@playwright/test';

export default abstract class BasePage {
  constructor(public readonly page: Page) {}

  private readonly loadingIndicators = [
    '.pf-v6-c-spinner',
    '.pf-v5-c-spinner',
    '.pf-c-spinner',
    '.co-m-loader',
    '[data-test="loading-indicator"]',
    '[data-test="loading-box"]',
    '.loading-skeleton',
    '.skeleton-catalog--grid',
    '[class*="skeleton"]',
  ];

  protected async waitForLoadingComplete(timeoutMs = 5_000): Promise<void> {
    const loadingSelector = this.loadingIndicators.join(', ');
    const loadingElements = this.page.locator(loadingSelector);
    try {
      const count = await loadingElements.count().catch(() => 0);
      if (count > 0) {
        await loadingElements.first().waitFor({ state: 'hidden', timeout: timeoutMs });
      }
    } catch {
      // Loading indicators may have already disappeared — continue
    }
  }

  protected async goTo(url: string): Promise<void> {
    await this.page.goto(url, { timeout: 90_000 });
    await this.waitForLoadingComplete();
  }

  protected locator(
    selector: string,
    options?: {
      has?: Locator;
      hasNot?: Locator;
      hasNotText?: RegExp | string;
      hasText?: RegExp | string;
    },
  ): Locator {
    return this.page.locator(selector, options);
  }

  protected async robustClick(
    locator: Locator,
    options: {
      timeout?: number;
      retries?: number;
      retryDelay?: number;
      force?: boolean;
    } = {},
  ): Promise<void> {
    const { timeout = 30_000, retries = 3, retryDelay = 1_000, force = false } = options;
    let lastError: Error | null = null;
    const attemptTimeout = timeout / retries;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.waitForLoadingComplete(Math.min(attemptTimeout / 4, 3_000));
        await locator.waitFor({ state: 'visible', timeout: attemptTimeout });
        await locator.scrollIntoViewIfNeeded({ timeout: attemptTimeout / 3 });

        try {
          await locator.click({ force, timeout: attemptTimeout });
          return;
        } catch (clickError) {
          const msg = clickError instanceof Error ? clickError.message : String(clickError);
          if (attempt < retries && (msg.includes('intercept') || msg.includes('not visible'))) {
            await locator.click({ force: true, timeout: attemptTimeout });
            return;
          }
          throw clickError;
        }
      } catch (error) {
        lastError = error;
        if (attempt < retries && retryDelay > 100) {
          await this.page.waitForTimeout(retryDelay);
        }
      }
    }
    throw new Error(`robustClick failed after ${retries} attempts: ${lastError?.message}`);
  }

  async navigateToTab(locator: Locator, timeoutMs = 60_000): Promise<void> {
    await this.robustClick(locator, { timeout: timeoutMs });
    await this.waitForLoadingComplete();
  }

  async clickButtonByText(buttonText: string): Promise<void> {
    const button = this.locator('button', { hasText: buttonText });
    await this.robustClick(button);
  }
}
