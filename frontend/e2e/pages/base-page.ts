import { type Locator, type Page, expect } from '@playwright/test';

export async function getEditorContent(page: Page): Promise<string> {
  await page.waitForFunction(
    () => {
      const value = (window as any).monaco?.editor?.getModels()?.[0]?.getValue?.();
      return typeof value === 'string' && value.trim().length > 0;
    },
    { timeout: 30_000 },
  );
  return page.evaluate(() => {
    return (window as any).monaco.editor.getModels()[0].getValue();
  });
}

export async function setEditorContent(page: Page, content: string): Promise<void> {
  await page.waitForFunction(() => (window as any).monaco?.editor?.getModels()?.[0], {
    timeout: 10_000,
  });
  await page.evaluate((text) => {
    (window as any).monaco.editor.getModels()[0].setValue(text);
  }, content);
}

export async function warmupSPA(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('page-heading')).toBeVisible();
}

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
        // eslint-disable-next-line no-restricted-syntax
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

  protected async retryOnError(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
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
        // eslint-disable-next-line no-restricted-syntax
        await locator.waitFor({ state: 'visible', timeout: attemptTimeout });
        await locator.scrollIntoViewIfNeeded({ timeout: attemptTimeout / 3 });

        try {
          await locator.click({ force, timeout: attemptTimeout });
          return;
        } catch (clickError) {
          const msg = clickError instanceof Error ? clickError.message : String(clickError);
          if (attempt < retries && (msg.includes('intercept') || msg.includes('not visible'))) {
            // eslint-disable-next-line playwright/no-force-option
            await locator.click({ force: true, timeout: attemptTimeout });
            return;
          }
          throw clickError;
        }
      } catch (error) {
        lastError = error;
        if (attempt < retries && retryDelay > 100) {
          // eslint-disable-next-line playwright/no-wait-for-timeout
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
    const button = this.page.getByRole('button', { name: buttonText });
    await this.robustClick(button);
  }

  async waitForEditorReady(): Promise<void> {
    await this.page.waitForFunction(
      () => !!(window as any).monaco?.editor?.getModels()?.[0],
      { timeout: 30_000 },
    );
  }

  async getEditorContent(): Promise<string> {
    return getEditorContent(this.page);
  }

  async setEditorContent(content: string): Promise<void> {
    await setEditorContent(this.page, content);
  }

  async ensureFormView(formFieldLocator?: Locator): Promise<void> {
    const syncedEditor = this.page.getByTestId('synced-editor-field');
    // eslint-disable-next-line no-restricted-syntax
    await syncedEditor.waitFor({ state: 'visible', timeout: 60_000 });
    const formRadio = syncedEditor.getByRole('radio', { name: 'Form view' });
    if (!(await formRadio.isChecked())) {
      await formRadio.click();
    }
    if (formFieldLocator) {
      // Wait for form to render after switching to form view (not acting on it, just ensuring visibility)
      // eslint-disable-next-line no-restricted-syntax
      await formFieldLocator.waitFor({ state: 'visible', timeout: 30_000 });
    }
  }

  async switchPerspective(target: 'Developer' | 'Administrator'): Promise<void> {
    const labelMap: Record<string, string[]> = {
      Administrator: ['Administrator', 'Core platform'],
      Developer: ['Developer'],
    };
    const toggle = this.page.locator('[data-test-id="perspective-switcher-toggle"]');
    const labels = labelMap[target] || [target];
    const currentText = (await toggle.textContent()) || '';
    if (labels.some((label) => currentText.includes(label))) {
      return;
    }
    await this.robustClick(toggle);
    const menuOption = this.page.locator('[data-test-id="perspective-switcher-menu-option"]');
    for (const label of labels) {
      const option = menuOption.filter({ hasText: label });
      if ((await option.count()) > 0) {
        await this.robustClick(option.first());
        await this.waitForLoadingComplete();
        return;
      }
    }
    throw new Error(`Perspective "${target}" not found in switcher menu`);
  }
}
