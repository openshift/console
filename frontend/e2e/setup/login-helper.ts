import * as fs from 'fs';
import * as path from 'path';

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

const STORAGE_STATE_DIR = path.resolve(import.meta.dirname, '..', '.auth');

export function getBaseURL(): string {
  return process.env.WEB_CONSOLE_URL || 'http://localhost:9000';
}

export function getAdminCredentials(): { username: string; password: string; idpName: string } {
  return {
    username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
    password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
    idpName: 'kube:admin',
  };
}

export function getDeveloperCredentials(): {
  username: string;
  password: string;
  idpName: string;
} | null {
  const username = process.env.BRIDGE_HTPASSWD_USERNAME;
  const password = process.env.BRIDGE_HTPASSWD_PASSWORD;
  if (!username || !password) return null;
  return {
    username,
    password,
    idpName: process.env.BRIDGE_HTPASSWD_IDP || username,
  };
}

export async function performLogin(
  page: Page,
  username: string,
  password: string,
  idpName?: string,
): Promise<void> {
  await page.goto(getBaseURL(), { timeout: 90_000, waitUntil: 'domcontentloaded' });

  const authDisabled = await page
    .evaluate(() => (window as any).SERVER_FLAGS?.authDisabled)
    .catch(() => false);

  if (authDisabled) {
    return;
  }

  await expect(
    page.locator('[data-test-id="login"]').or(page.locator('#inputUsername')).first(),
  ).toBeVisible({ timeout: 30_000 });

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
