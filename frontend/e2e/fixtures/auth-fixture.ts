import type { Page, TestInfo } from '@playwright/test';

import {
  isOnLoginPage,
  performLogin,
  resolveCredentialsForStorageState,
  saveStorageState,
} from '../setup/login-helper';

/**
 * Guards against re-entrant / concurrent re-login attempts on the same page.
 */
const reloginInProgress = new WeakMap<Page, Promise<void>>();

function storageStatePath(testInfo: TestInfo): string | undefined {
  const state = testInfo.project.use.storageState;
  return typeof state === 'string' ? state : undefined;
}

/**
 * Detects when a navigation has landed on the OAuth login page — meaning the
 * session snapshot in storageState has expired — and transparently
 * re-authenticates the current persona, refreshing the stored session so
 * subsequent tests reuse the fresh state.
 *
 * The setup projects establish the session once; long runs can outlive the
 * OAuth token, after which every navigation silently redirects to the login
 * page and tests hang waiting for elements that never appear. This fixture is
 * the self-healing recovery for that case.
 */
export async function recoverSessionIfExpired(
  page: Page,
  testInfo: TestInfo,
): Promise<boolean> {
  if (!(await isOnLoginPage(page))) {
    return false;
  }

  const existing = reloginInProgress.get(page);
  if (existing) {
    await existing;
    return true;
  }

  const statePath = storageStatePath(testInfo);
  const credentials = statePath ? resolveCredentialsForStorageState(statePath) : undefined;
  if (!credentials) {
    // No credentials to recover with (e.g. auth disabled or dev creds unset).
    return false;
  }

  const relogin = (async () => {
    // eslint-disable-next-line no-console
    console.warn(
      `[auth] Session expired for "${testInfo.titlePath.join(' > ')}"; re-authenticating.`,
    );
    await performLogin(page, credentials.username, credentials.password, credentials.idpName);
    if (statePath) {
      await saveStorageState(page, statePath);
    }
  })();

  reloginInProgress.set(page, relogin);
  try {
    await relogin;
  } finally {
    reloginInProgress.delete(page);
  }
  return true;
}

/**
 * Attaches a main-frame navigation listener that re-authenticates whenever a
 * navigation lands on the login page. Returns a disposer to detach it.
 */
export function attachSessionRecovery(page: Page, testInfo: TestInfo): () => void {
  const handler = (frame: import('@playwright/test').Frame) => {
    if (frame !== page.mainFrame()) {
      return;
    }
    // Fire-and-forget: recovery guards its own re-entrancy. Swallow errors so a
    // transient navigation event doesn't reject an unrelated step.
    void recoverSessionIfExpired(page, testInfo).catch(() => {
      /* best-effort recovery */
    });
  };
  page.on('framenavigated', handler);
  return () => page.off('framenavigated', handler);
}
