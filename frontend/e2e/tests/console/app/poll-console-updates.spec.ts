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

type RouteHandler = (route: import('@playwright/test').Route) => void;

/**
 * Creates a mutable route handler whose behavior can be swapped at runtime.
 * This avoids Playwright's handler stacking issues (where calling page.route()
 * multiple times on the same URL adds stacked handlers). Instead, we register
 * ONE handler that delegates to a mutable reference.
 */
function createMutableHandler(initial: RouteHandler) {
  let current = initial;
  const handler: RouteHandler = (route) => current(route);
  const setHandler = (next: RouteHandler) => {
    current = next;
  };
  return { handler, setHandler };
}

/**
 * Wait for N successful check-updates responses (status 200).
 * Must be called BEFORE page.goto so the listener catches the first response.
 */
function waitForResponses(
  page: import('@playwright/test').Page,
  n: number,
): Promise<void> {
  let count = 0;
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`waitForResponses: only saw ${count}/${n} responses`)),
      90_000,
    );
    const handler = (resp: import('@playwright/test').Response) => {
      if (resp.url().includes('/api/check-updates') && resp.status() === 200) {
        count++;
        if (count >= n) {
          clearTimeout(timer);
          page.off('response', handler);
          resolve();
        }
      }
    };
    page.on('response', handler);
  });
}

test.describe('PollConsoleUpdates', { tag: ['@admin'] }, () => {
  test('triggers the console update toast when consoleCommit changes', async ({ page }) => {
    const updates = createMutableHandler((route) =>
      route.fulfill({ json: UPDATES_DEFAULT }),
    );
    await page.route(CHECK_UPDATES_URL, updates.handler);

    const ready = waitForResponses(page, 2);
    await page.goto('/');
    await ready;

    updates.setHandler((route) => route.fulfill({ json: UPDATES_NEW_COMMIT }));

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 60_000 });
  });

  test('triggers the console update toast when a plugin is added', async ({ page }) => {
    const updates = createMutableHandler((route) =>
      route.fulfill({ json: UPDATES_DEFAULT }),
    );
    const manifest = createMutableHandler((route) => route.abort());
    await page.route(CHECK_UPDATES_URL, updates.handler);
    await page.route(PLUGIN_MANIFEST_URL, manifest.handler);

    const ready = waitForResponses(page, 2);
    await page.goto('/');
    await ready;

    // Announce the plugin but keep its manifest endpoint down.
    updates.setHandler((route) => route.fulfill({ json: UPDATES_NEW_PLUGIN }));

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 30_000,
    });

    // Make the manifest endpoint available — toast should appear.
    manifest.setHandler((route) => route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT }));

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 120_000 });
  });

  test('triggers the console update toast when a plugin is added and a different plugin endpoint is erroring', async ({
    page,
  }) => {
    const updates = createMutableHandler((route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN }),
    );
    const manifest1 = createMutableHandler((route) => route.abort());
    const manifest2 = createMutableHandler((route) => route.abort());
    await page.route(PLUGIN_MANIFEST_URL, manifest1.handler);
    await page.route(CHECK_UPDATES_URL, updates.handler);
    await page.route(PLUGIN_MANIFEST_URL2, manifest2.handler);

    const ready = waitForResponses(page, 2);
    await page.goto('/');
    await ready;

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 30_000,
    });

    // Add a second plugin — both manifests still down.
    updates.setHandler((route) => route.fulfill({ json: UPDATES_NEW_PLUGIN2 }));

    await page.waitForResponse((resp) => resp.url().includes('/api/check-updates'));

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 30_000,
    });

    // Make plugin2 manifest reachable — toast should appear.
    manifest2.setHandler((route) => route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT2 }));

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 120_000 });
  });

  test('triggers the console update toast when a plugin is removed', async ({ page }) => {
    const updates = createMutableHandler((route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN }),
    );
    await page.route(CHECK_UPDATES_URL, updates.handler);
    await page.route(PLUGIN_MANIFEST_URL, (route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT }),
    );

    const ready = waitForResponses(page, 2);
    await page.goto('/');
    await ready;

    updates.setHandler((route) => route.fulfill({ json: UPDATES_DEFAULT }));

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 60_000 });
  });

  test('triggers the console update toast when a plugin version changes', async ({ page }) => {
    const manifest = createMutableHandler((route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT }),
    );
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN }),
    );
    await page.route(PLUGIN_MANIFEST_URL, manifest.handler);

    const ready = waitForResponses(page, 2);
    await page.goto('/');
    await ready;

    manifest.setHandler((route) => route.fulfill({ json: PLUGIN_MANIFEST_NEW_VERSION }));

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 120_000 });
  });
});
