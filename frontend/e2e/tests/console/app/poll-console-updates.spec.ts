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

// Wait for the route mock to serve two check-updates responses. The component uses
// a prev/current ref pattern and needs two poll cycles before it can detect changes.
async function waitForBaseline(page: import('@playwright/test').Page): Promise<void> {
  let count = 0;
  await new Promise<void>((resolve) => {
    page.on('response', (resp) => {
      if (
        resp.url().includes('/api/check-updates') &&
        resp.status() === 200 &&
        resp.headers()['x-mock'] === '1'
      ) {
        count++;
        if (count >= 2) resolve();
      }
    });
  });
}

test.describe('PollConsoleUpdates', { tag: ['@admin'] }, () => {
  test('triggers the console update toast when consoleCommit changes', async ({ page }) => {
    let payload = UPDATES_DEFAULT;

    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: payload, headers: { 'x-mock': '1' } }),
    );

    const baseline = waitForBaseline(page);
    await page.goto('/');
    await baseline;

    payload = UPDATES_NEW_COMMIT;

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 60_000 });
  });

  test('triggers the console update toast when a plugin is added', async ({ page }) => {
    let updatesPayload = UPDATES_DEFAULT;
    let manifestAbort = true;

    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: updatesPayload, headers: { 'x-mock': '1' } }),
    );
    await page.route(PLUGIN_MANIFEST_URL, (route) => {
      if (manifestAbort) {
        return route.abort();
      }
      return route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT });
    });

    const baseline = waitForBaseline(page);
    await page.goto('/');
    await baseline;

    updatesPayload = UPDATES_NEW_PLUGIN;

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 10_000,
    });

    manifestAbort = false;

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 60_000 });
  });

  test('triggers the console update toast when a plugin is added and a different plugin endpoint is erroring', async ({
    page,
  }) => {
    let updatesPayload = UPDATES_NEW_PLUGIN;
    let manifest1Abort = true;
    let manifest2Abort = true;

    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: updatesPayload, headers: { 'x-mock': '1' } }),
    );
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

    const baseline = waitForBaseline(page);
    await page.goto('/');
    await baseline;

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 10_000,
    });

    updatesPayload = UPDATES_NEW_PLUGIN2;

    await page.waitForResponse((resp) => resp.url().includes('/api/check-updates'));

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 10_000,
    });

    manifest2Abort = false;

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 60_000 });
  });

  test('triggers the console update toast when a plugin is removed', async ({ page }) => {
    let updatesPayload = UPDATES_NEW_PLUGIN;

    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: updatesPayload, headers: { 'x-mock': '1' } }),
    );
    await page.route(PLUGIN_MANIFEST_URL, (route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT }),
    );

    const baseline = waitForBaseline(page);
    await page.goto('/');
    await baseline;

    updatesPayload = UPDATES_DEFAULT;

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 60_000 });
  });

  test('triggers the console update toast when a plugin version changes', async ({ page }) => {
    let manifestFetchCount = 0;
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN, headers: { 'x-mock': '1' } }),
    );
    await page.route(PLUGIN_MANIFEST_URL, (route) => {
      manifestFetchCount++;
      if (manifestFetchCount <= 2) {
        return route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT });
      }
      return route.fulfill({ json: PLUGIN_MANIFEST_NEW_VERSION });
    });
    await page.goto('/');

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 60_000 });
  });
});
