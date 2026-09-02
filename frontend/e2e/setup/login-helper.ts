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

/**
 * Resolves the login credentials for a given storage-state file. The auth
 * fixture uses this to re-authenticate the correct persona (admin vs.
 * developer) when a session expires mid-run, mirroring the setup projects.
 * Returns null when the required credentials are not configured.
 */
export function resolveCredentialsForStorageState(
  storageStatePath: string,
): { username: string; password: string; idpName: string } | null {
  const fileName = path.basename(storageStatePath);
  if (fileName === 'developer.json') {
    return getDeveloperCredentials();
  }
  // Default to the kubeadmin/admin persona.
  return getAdminCredentials();
}

/**
 * Returns true when the given page is showing the OAuth login page (i.e. the
 * session has expired or was never established).
 *
 * A session-expiry redirect goes through the OAuth server before the login
 * form renders, so an instantaneous visibility check can race the redirect
 * chain and miss it. `timeoutMs` gives the login locator a bounded window to
 * appear. It defaults to 0 (instantaneous) so callers on the hot path stay
 * cheap; pass a small timeout only when a redirect may still be settling.
 */
export async function isOnLoginPage(page: Page, timeoutMs = 0): Promise<boolean> {
  const loginLocator = page
    .locator('[data-test-id="login"]')
    .or(page.locator('#inputUsername'))
    .first();
  // timeoutMs === 0 means an instantaneous check. Note that Playwright's
  // waitFor treats timeout: 0 as "wait forever", so use the non-waiting
  // isVisible() for the zero case and only wait when a bounded window is asked
  // for.
  if (timeoutMs <= 0) {
    return loginLocator.isVisible().catch(() => false);
  }
  try {
    // eslint-disable-next-line no-restricted-syntax
    await loginLocator.waitFor({ state: 'visible', timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
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
  // Write to a unique temp file and atomically rename it into place. Workers are
  // separate processes, so two of them recovering the same persona could
  // otherwise interleave writes to the same file and leave a reader (another
  // worker loading storageState) observing a half-written, invalid JSON file.
  // A same-directory rename is atomic, so readers always see a complete file.
  const tmpPath = `${storagePath}.${process.pid}.tmp`;
  try {
    await page.context().storageState({ path: tmpPath });
    fs.chmodSync(tmpPath, 0o600);
    fs.renameSync(tmpPath, storagePath);
  } catch (error) {
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      // best-effort cleanup
    }
    throw error;
  }
}
