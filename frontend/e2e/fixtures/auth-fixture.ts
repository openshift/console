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
 * Records a page's intended (non-auth) destination so recovery can return there
 * after re-login. The page.goto override calls this before navigating: if the
 * target immediately redirects to the login page, the framenavigated handler
 * may only ever observe the auth URL, so relying on it alone would restore a
 * stale route. Auth and about:blank targets are ignored — they're never a route
 * a test wants to resume at. `url` may be relative; it is resolved against the
 * page's current URL for the auth-vs-app classification.
 */
export function rememberIntendedUrl(page: Page, url: string): void {
  if (!url || url === 'about:blank') {
    return;
  }
  let absolute: string;
  try {
    absolute = new URL(url, page.url()).toString();
  } catch {
    // Unparseable (e.g. a data: URL used in tests) — record verbatim.
    absolute = url;
  }
  if (!isAuthUrl(absolute)) {
    lastAppUrl.set(page, absolute);
  }
}

/**
 * The route recovery would restore for a page, or undefined if none recorded.
 * Exposed for the recovery regression tests.
 */
export function getIntendedUrl(page: Page): string | undefined {
  return lastAppUrl.get(page);
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
  // The claim resolves on success and rejects on failure so joiners (the
  // `existing` branch above) observe the same outcome instead of a false success.
  let release!: () => void;
  let fail!: (error: unknown) => void;
  const claim = new Promise<void>((resolve, reject) => {
    release = resolve;
    fail = reject;
  });
  // A rejected claim that nobody awaits is an unhandled rejection; attach a
  // no-op catch to the stored copy so only explicit awaiters see the error.
  claim.catch(() => {});
  reloginInProgress.set(page, claim);

  try {
    if (!(await isOnLoginPage(page, detectTimeoutMs))) {
      release();
      return false;
    }

    const statePath = storageStatePath(testInfo);
    const credentials = statePath ? resolveCredentialsForStorageState(statePath) : null;
    if (!credentials) {
      // No credentials to recover with (e.g. auth disabled or dev creds unset).
      release();
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
    release();
    return true;
  } catch (error) {
    // Propagate the failure to every awaiter of this claim.
    fail(error);
    throw error;
  } finally {
    reloginInProgress.delete(page);
  }
}

/**
 * True while a re-login is running (or being set up) for the page. The page.goto
 * override consults this to skip the recovery step for recovery-owned
 * navigations — performLogin and the route-restoration goto both call the
 * overridden page.goto, and re-running recovery there would deadlock the
 * override on the very claim it is nested inside.
 */
export function isRecoveryInProgress(page: Page): boolean {
  return reloginInProgress.has(page);
}

/**
 * Awaits any session recovery currently in progress for the page (no-op if
 * none). Call this after a navigation so a test action doesn't race an
 * in-flight re-login triggered by that same navigation. A recovery failure is
 * propagated so the caller (e.g. the page.goto override) fails the active test
 * with the original error rather than silently proceeding on the login page.
 */
export async function awaitSessionRecovery(page: Page): Promise<void> {
  const inProgress = reloginInProgress.get(page);
  if (inProgress) {
    await inProgress;
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
