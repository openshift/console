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

// The component needs two poll cycles to initialize its prev/current refs before
// it can detect changes. Tests wait for two check-updates responses (baselineReady)
// before switching the mocked payload.
test.describe('PollConsoleUpdates', { tag: ['@admin'] }, () => {
  test('triggers the console update toast when consoleCommit changes', async ({ page }) => {
    let payload = UPDATES_DEFAULT;

    await page.route(CHECK_UPDATES_URL, (route) => route.fulfill({ json: payload }));

    // Start listening for responses BEFORE navigating so we don't miss the first poll.
    let responseCount = 0;
    const baselineReady = new Promise<void>((resolve) => {
      page.on('response', (resp) => {
        if (resp.url().includes('/api/check-updates') && resp.status() === 200) {
          responseCount++;
          if (responseCount >= 2) {
            resolve();
          }
        }
      });
    });

    await page.goto('/');
    await baselineReady;

    // Switch the payload — the next poll will see a different consoleCommit.
    payload = UPDATES_NEW_COMMIT;

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 300_000 });
  });

  test('triggers the console update toast when a plugin is added', async ({ page }) => {
    let updatesPayload = UPDATES_DEFAULT;
    let manifestAbort = true;

    await page.route(CHECK_UPDATES_URL, (route) => route.fulfill({ json: updatesPayload }));
    await page.route(PLUGIN_MANIFEST_URL, (route) => {
      if (manifestAbort) {
        return route.abort();
      }
      return route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT });
    });

    let responseCount = 0;
    const baselineReady = new Promise<void>((resolve) => {
      page.on('response', (resp) => {
        if (resp.url().includes('/api/check-updates') && resp.status() === 200) {
          responseCount++;
          if (responseCount >= 2) {
            resolve();
          }
        }
      });
    });

    await page.goto('/');
    await baselineReady;

    // Add a plugin whose manifest endpoint is erroring — toast should NOT appear yet.
    updatesPayload = UPDATES_NEW_PLUGIN;

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 10_000,
    });

    // Make the manifest endpoint succeed — toast should now appear.
    manifestAbort = false;

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 300_000 });
  });

  test('triggers the console update toast when a plugin is added and a different plugin endpoint is erroring', async ({
    page,
  }) => {
    let updatesPayload = UPDATES_NEW_PLUGIN;
    let manifest1Abort = true;
    let manifest2Abort = true;

    await page.route(CHECK_UPDATES_URL, (route) => route.fulfill({ json: updatesPayload }));
    await page.route(PLUGIN_MANIFEST_URL, (route) => {
      if (manifest1Abort) {
        return route.abort();
      }
      return route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT });
    });
    await page.route(PLUGIN_MANIFEST_URL2, (route) => {
      if (manifest2Abort) {
        return route.abort();
      }
      return route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT2 });
    });

    let responseCount = 0;
    const baselineReady = new Promise<void>((resolve) => {
      page.on('response', (resp) => {
        if (resp.url().includes('/api/check-updates') && resp.status() === 200) {
          responseCount++;
          if (responseCount >= 2) {
            resolve();
          }
        }
      });
    });

    await page.goto('/');
    await baselineReady;

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 10_000,
    });

    // Introduce a second plugin — both manifest endpoints are still erroring.
    updatesPayload = UPDATES_NEW_PLUGIN2;

    // Wait for the app to poll and see the new plugin list.
    await page.waitForResponse((resp) => resp.url().includes('/api/check-updates'));

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 10_000,
    });

    // Make plugin2 manifest succeed — toast should appear.
    manifest2Abort = false;

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 300_000 });
  });

  test('triggers the console update toast when a plugin is removed', async ({ page }) => {
    let updatesPayload = UPDATES_NEW_PLUGIN;

    await page.route(CHECK_UPDATES_URL, (route) => route.fulfill({ json: updatesPayload }));
    await page.route(PLUGIN_MANIFEST_URL, (route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT }),
    );

    let responseCount = 0;
    const baselineReady = new Promise<void>((resolve) => {
      page.on('response', (resp) => {
        if (resp.url().includes('/api/check-updates') && resp.status() === 200) {
          responseCount++;
          if (responseCount >= 2) {
            resolve();
          }
        }
      });
    });

    await page.goto('/');
    await baselineReady;

    // Remove the plugin from the list.
    updatesPayload = UPDATES_DEFAULT;

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 300_000 });
  });

  test('triggers the console update toast when a plugin version changes', async ({ page }) => {
    // Serve the old version for the first few manifest fetches, then switch to the new version.
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
