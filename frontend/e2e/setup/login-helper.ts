import * as fs from 'fs';
import * as path from 'path';

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

const STORAGE_STATE_DIR = path.resolve(import.meta.dirname, '..', '.auth');

export async function performLogin(
  page: Page,
  baseURL: string,
  username: string,
  password: string,
  idpName?: string,
): Promise<void> {
  await page.goto(baseURL, { timeout: 90_000, waitUntil: 'domcontentloaded' });

  const authDisabled = await page
    .evaluate(() => (window as any).SERVER_FLAGS?.authDisabled)
    .catch(() => false);

  if (authDisabled) {
    return;
  }

  await page
    .locator('[data-test-id="login"]')
    .or(page.locator('#inputUsername'))
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });

  if (idpName) {
    const providerButton = page.getByText(idpName, { exact: true });
    if ((await providerButton.count()) > 0) {
      await providerButton.click();
    }
  }

  await page.locator('#inputUsername').fill(username);
  await page.locator('#inputPassword').fill(password);
  await page.locator('button[type="submit"]').click();

  await expect(page.getByTestId('user-dropdown-toggle')).toBeVisible({ timeout: 60_000 });
}

export async function saveStorageState(page: Page, storagePath: string): Promise<void> {
  fs.mkdirSync(STORAGE_STATE_DIR, { recursive: true, mode: 0o700 });
  await page.context().storageState({ path: storagePath });
  fs.chmodSync(storagePath, 0o600);
}
