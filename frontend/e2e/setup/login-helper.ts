import * as fs from 'fs';
import * as path from 'path';

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

const STORAGE_STATE_DIR = path.resolve(import.meta.dirname, '..', '.auth');

export const adminStorageState = path.join(STORAGE_STATE_DIR, 'kubeadmin.json');
export const developerStorageState = path.join(STORAGE_STATE_DIR, 'developer.json');

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

  const userMenu = page.getByTestId('user-dropdown-toggle');
  const loginForm = page.locator('[data-test-id="login"]').or(page.locator('#inputUsername'));

  // The context may already be authenticated (e.g. a reused storageState). In that
  // case the OAuth flow completes automatically and lands back on the console
  // without ever rendering a login form, so wait for whichever appears first.
  await expect(userMenu.or(loginForm).first()).toBeVisible({ timeout: 60_000 });
  if (await userMenu.isVisible().catch(() => false)) {
    return;
  }

  if (idpName) {
    const providerButton = page.getByText(idpName).first();
    if (await providerButton.isVisible().catch(() => false)) {
      await providerButton.click();
    }
  }

  await expect(page.locator('#inputUsername')).toBeVisible({ timeout: 30_000 });
  await page.locator('#inputUsername').fill(username);
  await page.locator('#inputPassword').fill(password);
  await page.locator('button[type="submit"]').click();

  await expect(userMenu).toBeVisible({ timeout: 60_000 });
}

/**
 * Log in using the credentials configured via environment variables for the
 * given persona. Admin uses the kubeadmin / kube:admin identity provider;
 * developer uses the htpasswd identity provider. Used both by the auth setup
 * projects and as a re-authentication fallback for specs whose shared
 * storageState session has expired or been invalidated mid-run.
 */
export async function loginFromEnv(
  page: Page,
  persona: 'admin' | 'developer',
  baseURL: string = process.env.WEB_CONSOLE_URL || 'http://localhost:9000',
): Promise<void> {
  if (persona === 'developer') {
    const username = process.env.BRIDGE_HTPASSWD_USERNAME;
    const password = process.env.BRIDGE_HTPASSWD_PASSWORD;
    if (!username || !password) {
      throw new Error(
        'Developer credentials (BRIDGE_HTPASSWD_USERNAME/PASSWORD) are not configured',
      );
    }
    const idpName = process.env.BRIDGE_HTPASSWD_IDP || username;
    await performLogin(page, baseURL, username, password, idpName);
    return;
  }

  const username = process.env.OPENSHIFT_USERNAME || 'kubeadmin';
  const password = process.env.BRIDGE_KUBEADMIN_PASSWORD || '';
  await performLogin(page, baseURL, username, password, 'kube:admin');
}

export async function saveStorageState(page: Page, storagePath: string): Promise<void> {
  fs.mkdirSync(STORAGE_STATE_DIR, { recursive: true, mode: 0o700 });
  await page.context().storageState({ path: storagePath });
  fs.chmodSync(storagePath, 0o600);
}
