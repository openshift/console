import type { Frame, Page, Response, Route } from '@playwright/test';
import { test, expect } from '../../../fixtures';

const CHECK_UPDATES_URL = '**/api/check-updates';
const PLUGIN_NAME = 'console-demo-plugin';
const PLUGIN_NAME2 = 'console-demo-plugin2';
const PLUGIN_MANIFEST_URL = `**/api/plugins/${PLUGIN_NAME}/plugin-manifest.json`;
const PLUGIN_MANIFEST_URL2 = `**/api/plugins/${PLUGIN_NAME2}/plugin-manifest.json`;
const HASH_DEFAULT = 'hash';
const PLUGINS_DEFAULT: string[] = [];

const UPDATES_DEFAULT = { consoleCommit: HASH_DEFAULT, plugins: PLUGINS_DEFAULT };
const UPDATES_NEW_COMMIT = { consoleCommit: 'newhash', plugins: PLUGINS_DEFAULT };
const UPDATES_NEW_PLUGIN = { consoleCommit: HASH_DEFAULT, plugins: [PLUGIN_NAME] };
const UPDATES_NEW_PLUGIN2 = {
  consoleCommit: HASH_DEFAULT,
  plugins: [PLUGIN_NAME, PLUGIN_NAME2],
};
const PLUGIN_MANIFEST_DEFAULT = { name: PLUGIN_NAME, version: '0.0.0' };
const PLUGIN_MANIFEST_DEFAULT2 = { name: PLUGIN_NAME2, version: '0.0.0' };
const PLUGIN_MANIFEST_NEW_VERSION = { name: PLUGIN_NAME, version: '1.0.0' };

type RouteHandler = (route: Route) => void;

// Single handler avoids Playwright's handler stacking when re-routing the same URL.
function createMutableHandler(initial: RouteHandler) {
  let current = initial;
  const handler: RouteHandler = (route) => current(route);
  const setHandler = (next: RouteHandler) => {
    current = next;
  };
  return { handler, setHandler };
}

// PollConsoleUpdates needs 2 poll cycles to initialize; main-frame navs reset the counter.
async function navigateAndWaitForInit(page: Page) {
  let count = 0;
  let initResolve: () => void;
  let initReject: (err: Error) => void;
  const initPromise = new Promise<void>((resolve, reject) => {
    initResolve = resolve;
    initReject = reject;
  });

  const resetOnNav = (frame: Frame) => {
    if (frame === page.mainFrame()) count = 0;
  };
  const onResponse = (resp: Response) => {
    if (resp.url().includes('/api/check-updates') && resp.status() === 200) {
      count++;
      if (count >= 2) {
        page.off('response', onResponse);
        initResolve();
      }
    }
  };

  page.on('framenavigated', resetOnNav);
  page.on('response', onResponse);

  const timer = setTimeout(() => {
    page.off('response', onResponse);
    initReject(new Error(`navigateAndWaitForInit: only saw ${count}/2 responses`));
  }, 90_000);

  try {
    await page.goto('/');
    await expect(page.getByTestId('dashboard').first()).toBeVisible({
      timeout: 60_000,
    });
    await initPromise;
  } finally {
    clearTimeout(timer);
    page.off('framenavigated', resetOnNav);
    page.off('response', onResponse);
    initPromise.catch(() => {});
  }
}

test.describe('PollConsoleUpdates', { tag: ['@admin'] }, () => {
  // Each test needs multiple 15s polling cycles (init + change detection + endpoint readiness).
  // The default 120s is too tight for CI where auth redirects add overhead.
  test.setTimeout(300_000);

  test('triggers the console update toast when consoleCommit changes', async ({ page }) => {
    const updates = createMutableHandler((route) => route.fulfill({ json: UPDATES_DEFAULT }));
    await page.route(CHECK_UPDATES_URL, updates.handler);

    await navigateAndWaitForInit(page);

    updates.setHandler((route) => route.fulfill({ json: UPDATES_NEW_COMMIT }));
    await page.waitForResponse((resp) => resp.url().includes('/api/check-updates'), {
      timeout: 30_000,
    });

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 60_000 });
  });

  test('triggers the console update toast when a plugin is added', async ({ page }) => {
    const updates = createMutableHandler((route) => route.fulfill({ json: UPDATES_DEFAULT }));
    const manifest = createMutableHandler((route) => route.abort());
    await page.route(CHECK_UPDATES_URL, updates.handler);
    await page.route(PLUGIN_MANIFEST_URL, manifest.handler);

    await navigateAndWaitForInit(page);

    updates.setHandler((route) => route.fulfill({ json: UPDATES_NEW_PLUGIN }));
    await page.waitForResponse((resp) => resp.url().includes('/api/check-updates'), {
      timeout: 30_000,
    });

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 30_000,
    });

    manifest.setHandler((route) => route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT }));

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 120_000 });
  });

  test('triggers the console update toast when a plugin is added and a different plugin endpoint is erroring', async ({
    page,
  }) => {
    const updates = createMutableHandler((route) => route.fulfill({ json: UPDATES_NEW_PLUGIN }));
    const manifest1 = createMutableHandler((route) => route.abort());
    const manifest2 = createMutableHandler((route) => route.abort());
    await page.route(PLUGIN_MANIFEST_URL, manifest1.handler);
    await page.route(CHECK_UPDATES_URL, updates.handler);
    await page.route(PLUGIN_MANIFEST_URL2, manifest2.handler);

    await navigateAndWaitForInit(page);

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 30_000,
    });

    updates.setHandler((route) => route.fulfill({ json: UPDATES_NEW_PLUGIN2 }));

    await page.waitForResponse(
      (resp) => resp.url().includes('/api/check-updates') && resp.status() === 200,
      { timeout: 30_000 },
    );

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 30_000,
    });

    manifest2.setHandler((route) => route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT2 }));

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 120_000 });
  });

  test('triggers the console update toast when a plugin is removed', async ({ page }) => {
    const updates = createMutableHandler((route) => route.fulfill({ json: UPDATES_NEW_PLUGIN }));
    await page.route(CHECK_UPDATES_URL, updates.handler);
    await page.route(PLUGIN_MANIFEST_URL, (route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT }),
    );

    await navigateAndWaitForInit(page);

    updates.setHandler((route) => route.fulfill({ json: UPDATES_DEFAULT }));

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 60_000 });
  });

  test('triggers the console update toast when a plugin version changes', async ({ page }) => {
    const manifest = createMutableHandler((route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT }),
    );
    await page.route(CHECK_UPDATES_URL, (route) => route.fulfill({ json: UPDATES_NEW_PLUGIN }));
    await page.route(PLUGIN_MANIFEST_URL, manifest.handler);

    await navigateAndWaitForInit(page);

    manifest.setHandler((route) => route.fulfill({ json: PLUGIN_MANIFEST_NEW_VERSION }));

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 120_000 });
  });
});
