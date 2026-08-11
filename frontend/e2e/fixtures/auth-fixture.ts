import type { Frame, Page, TestInfo } from '@playwright/test';

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

/**
 * The last app route each page navigated to before any auth redirect. Used to
 * send the page back where the test intended to be after re-authenticating,
 * since by the time recovery runs the page URL is the OAuth/login page.
 */
const lastAppUrl = new WeakMap<Page, string>();

function storageStatePath(testInfo: TestInfo): string | undefined {
  const state = testInfo.project.use.storageState;
  return typeof state === 'string' ? state : undefined;
}

/**
 * True for OAuth server / console login URLs — the pages a session-expiry
 * redirect passes through. These are never the route a test wants to resume at.
 *
 * Matches against the URL pathname and anchors on known auth path prefixes so
 * console resource routes that merely contain "auth" or "login" as a segment
 * (e.g. a Secret named "auth") aren't misclassified.
 */
function isAuthUrl(url: string): boolean {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return false;
  }
  return /^\/(oauth2?|login|auth)(\/|$)/.test(pathname);
}

/**
 * Detects when a navigation has landed on the OAuth login page — meaning the
 * session snapshot in storageState has expired — and transparently
 * re-authenticates the current persona, refreshing the stored session so
 * subsequent tests reuse the fresh state. After re-login, navigates back to
 * the route the test was heading to so deep-link tests resume in place.
 *
 * The setup projects establish the session once; long runs can outlive the
 * OAuth token, after which every navigation silently redirects to the login
 * page and tests hang waiting for elements that never appear. This fixture is
 * the self-healing recovery for that case.
 */
export async function recoverSessionIfExpired(
  page: Page,
  testInfo: TestInfo,
  detectTimeoutMs = 0,
): Promise<boolean> {
  // If a re-login is already running (or being set up) for this page, await it
  // rather than starting a second one.
  const existing = reloginInProgress.get(page);
  if (existing) {
    await existing;
    return true;
  }

  // Claim the re-login slot synchronously — before any await — so concurrent
  // navigation events can't both pass the check above and launch duplicate
  // logins. The deferred is published now and settled in the finally below;
  // keeping every early return and rejection inside the try guarantees the
  // slot is always released (a stuck claim would block all future recovery).
  let release!: () => void;
  const claim = new Promise<void>((resolve) => {
    release = resolve;
  });
  reloginInProgress.set(page, claim);

  try {
    if (!(await isOnLoginPage(page, detectTimeoutMs))) {
      return false;
    }

    const statePath = storageStatePath(testInfo);
    const credentials = statePath ? resolveCredentialsForStorageState(statePath) : null;
    if (!credentials) {
      // No credentials to recover with (e.g. auth disabled or dev creds unset).
      return false;
    }

    const intendedUrl = lastAppUrl.get(page);
    // eslint-disable-next-line no-console
    console.warn(
      `[auth] Session expired for "${testInfo.titlePath.join(' > ')}"; re-authenticating.`,
    );
    await performLogin(page, credentials.username, credentials.password, credentials.idpName);
    if (statePath) {
      await saveStorageState(page, statePath);
    }
    // Restore the route the test was navigating to before the redirect, so
    // deep-link tests resume where they expected rather than on the console
    // home page that performLogin lands on.
    if (intendedUrl && intendedUrl !== page.url()) {
      await page.goto(intendedUrl, { waitUntil: 'domcontentloaded' });
    }
    return true;
  } finally {
    release();
    reloginInProgress.delete(page);
  }
}

/**
 * Awaits any session recovery currently in progress for the page (no-op if
 * none). Call this after a navigation so a test action doesn't race an
 * in-flight re-login triggered by that same navigation.
 */
export async function awaitSessionRecovery(page: Page): Promise<void> {
  const inProgress = reloginInProgress.get(page);
  if (inProgress) {
    await inProgress.catch(() => {
      /* best-effort — recovery errors are surfaced by the failing test action */
    });
  }
}

/**
 * Attaches a main-frame navigation listener that re-authenticates whenever a
 * navigation lands on the login page. Returns a disposer to detach it.
 */
export function attachSessionRecovery(page: Page, testInfo: TestInfo): () => void {
  const handler = (frame: Frame) => {
    if (frame !== page.mainFrame()) {
      return;
    }
    const url = frame.url();
    const onAuthUrl = isAuthUrl(url);
    // Remember the most recent non-auth route so recovery can return to it.
    if (url && url !== 'about:blank' && !onAuthUrl) {
      lastAppUrl.set(page, url);
    }
    // On a normal (non-auth) navigation, detect the login page instantly so the
    // hot path adds no latency. When we land on an auth URL the session likely
    // expired but the login form may still be rendering, so give it a bounded
    // window to appear before deciding recovery isn't needed.
    // Fire-and-forget: recovery guards its own re-entrancy. Swallow errors so a
    // transient navigation event doesn't reject an unrelated step.
    void recoverSessionIfExpired(page, testInfo, onAuthUrl ? 5_000 : 0).catch(() => {
      /* best-effort recovery */
    });
  };
  page.on('framenavigated', handler);
  return () => page.off('framenavigated', handler);
}
