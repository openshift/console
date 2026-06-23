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

test.describe('PollConsoleUpdates', { tag: ['@admin'] }, () => {
  test('triggers the console update toast when consoleCommit changes', async ({ page }) => {
    let resolveFirst: () => void;
    const firstIntercepted = new Promise<void>((r) => {
      resolveFirst = r;
    });

    await page.route(CHECK_UPDATES_URL, async (route) => {
      await route.fulfill({ json: UPDATES_DEFAULT });
      resolveFirst();
    });
    await page.goto('/');
    await firstIntercepted;

    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_COMMIT }),
    );

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 300_000 });
  });

  test('triggers the console update toast when a plugin is added', async ({ page }) => {
    let resolveDefault: () => void;
    const defaultIntercepted = new Promise<void>((r) => {
      resolveDefault = r;
    });

    await page.route(CHECK_UPDATES_URL, async (route) => {
      await route.fulfill({ json: UPDATES_DEFAULT });
      resolveDefault();
    });
    await page.goto('/');
    await defaultIntercepted;

    await page.route(PLUGIN_MANIFEST_URL, (route) => route.abort());
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN }),
    );

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 10_000,
    });

    await page.route(PLUGIN_MANIFEST_URL, (route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT }),
    );

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 300_000 });
  });

  test('triggers the console update toast when a plugin is added and a different plugin endpoint is erroring', async ({
    page,
  }) => {
    await page.route(PLUGIN_MANIFEST_URL, (route) => route.abort());
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN }),
    );
    await page.goto('/');

    // Wait for the first check-updates poll to establish baseline state
    await page.waitForResponse((resp) => resp.url().includes('/api/check-updates'));

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 10_000,
    });

    // Now introduce a second plugin — plugin1 manifest still errors, plugin2 manifest also errors
    await page.route(PLUGIN_MANIFEST_URL2, (route) => route.abort());
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN2 }),
    );

    // Wait for the app to poll and see the new plugin list
    await page.waitForResponse((resp) => resp.url().includes('/api/check-updates'));

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 10_000,
    });

    // Make plugin2 manifest succeed — toast should appear
    await page.route(PLUGIN_MANIFEST_URL2, (route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT2 }),
    );

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 300_000 });
  });

  test('triggers the console update toast when a plugin is removed', async ({ page }) => {
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN }),
    );
    await page.route(PLUGIN_MANIFEST_URL, (route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT }),
    );
    await page.goto('/');

    await page.waitForResponse((resp) => resp.url().includes('/api/check-updates'));

    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_DEFAULT }),
    );

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 300_000 });
  });

  test('triggers the console update toast when a plugin version changes', async ({ page }) => {
    // Serve the old version for the first 2 manifest fetches, then switch to the new version.
    // The component needs at least one render cycle with the old version recorded as
    // prevPluginManifestsData before it can detect the version change.
    let manifestFetchCount = 0;
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN }),
    );
    await page.route(PLUGIN_MANIFEST_URL, (route) => {
      manifestFetchCount++;
      if (manifestFetchCount <= 2) {
        return route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT });
      }
      return route.fulfill({ json: PLUGIN_MANIFEST_NEW_VERSION });
    });
    await page.goto('/');

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 300_000 });
  });
});
