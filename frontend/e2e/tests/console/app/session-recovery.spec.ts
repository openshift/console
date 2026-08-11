import { test as base, expect } from '@playwright/test';

import { awaitSessionRecovery } from '../../../fixtures/auth-fixture';
import { isOnLoginPage } from '../../../setup/login-helper';

// Regression test for OCPBUGS-105789: https://issues.redhat.com/browse/OCPBUGS-105789
//
// The Playwright suite authenticates once and freezes the session into a
// storageState snapshot. When the OAuth token expires mid-run, navigations
// redirect to the login page and tests hang because nothing re-authenticates.
// The self-healing auth fixture recovers by detecting the login page and
// re-running performLogin.
//
// These tests pin the detection primitive the recovery flow depends on. They
// render markup via data: URLs so no cluster is required. The full re-login
// round-trip (performLogin -> OAuth -> route restoration) exercises a live
// OAuth server and is validated by the e2e suite running against a cluster.

const dataUrl = (body: string): string =>
  `data:text/html,${encodeURIComponent(`<!doctype html><html><body>${body}</body></html>`)}`;

const LOGIN_BY_TEST_ID = dataUrl(
  '<form data-test-id="login"><input id="inputUsername" /></form>',
);
const LOGIN_BY_INPUT = dataUrl('<input id="inputUsername" /><input id="inputPassword" />');
const APP_PAGE = dataUrl(
  '<div data-test="user-dropdown-toggle">user</div><div id="page-sidebar">app</div>',
);

// Uses the raw Playwright fixture (not e2e/fixtures) so the fixture's own
// goto/recovery wrapping doesn't interfere with these targeted assertions.
const test = base;

test.describe('Session recovery detection (OCPBUGS-105789)', () => {
  test('detects the login page by data-test-id="login"', async ({ page }) => {
    await page.goto(LOGIN_BY_TEST_ID);
    expect(await isOnLoginPage(page)).toBe(true);
  });

  test('detects the login page by the username/password inputs', async ({ page }) => {
    await page.goto(LOGIN_BY_INPUT);
    expect(await isOnLoginPage(page)).toBe(true);
  });

  test('does not treat an authenticated app page as the login page', async ({ page }) => {
    await page.goto(APP_PAGE);
    // Instantaneous check: the app page has no login markers.
    expect(await isOnLoginPage(page)).toBe(false);
  });

  test('waits the bounded window for a slow-rendering login form', async ({ page }) => {
    // Render the app first, then inject the login form after a delay to mimic
    // an OAuth redirect that hasn't finished painting when the check runs.
    await page.goto(APP_PAGE);
    await page.evaluate(() => {
      setTimeout(() => {
        const form = document.createElement('form');
        form.setAttribute('data-test-id', 'login');
        // An empty form has no layout box and reads as not visible, so give it
        // an input to render.
        form.appendChild(document.createElement('input'));
        document.body.appendChild(form);
      }, 500);
    });
    // Instantaneous check misses it; the bounded wait catches it.
    expect(await isOnLoginPage(page, 0)).toBe(false);
    expect(await isOnLoginPage(page, 3_000)).toBe(true);
  });

  test('awaitSessionRecovery is a no-op when no recovery is in progress', async ({ page }) => {
    await page.goto(APP_PAGE);
    await expect(awaitSessionRecovery(page)).resolves.toBeUndefined();
  });
});
