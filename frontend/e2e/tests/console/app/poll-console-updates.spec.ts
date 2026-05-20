import { test, expect } from '../../../fixtures';

const CHECK_UPDATES_URL = '**/api/check-updates';
const PLUGIN_NAME = 'console-demo-plugin';
const PLUGIN_NAME2 = 'console-demo-plugin2';
const HASH_DEFAULT = 'hash';

const UPDATES_DEFAULT = { consoleCommit: HASH_DEFAULT, plugins: [] as string[] };
const UPDATES_NEW_COMMIT = { consoleCommit: 'newhash', plugins: [] as string[] };
const UPDATES_NEW_PLUGIN = { consoleCommit: HASH_DEFAULT, plugins: [PLUGIN_NAME] };
const UPDATES_NEW_PLUGIN2 = {
  consoleCommit: HASH_DEFAULT,
  plugins: [PLUGIN_NAME, PLUGIN_NAME2],
};

const PLUGIN_MANIFEST_URL = `**/api/plugins/${PLUGIN_NAME}/plugin-manifest.json`;
const PLUGIN_MANIFEST_URL2 = `**/api/plugins/${PLUGIN_NAME2}/plugin-manifest.json`;
const PLUGIN_MANIFEST_DEFAULT = { name: PLUGIN_NAME, version: '0.0.0' };
const PLUGIN_MANIFEST_DEFAULT2 = { name: PLUGIN_NAME2, version: '0.0.0' };
const PLUGIN_MANIFEST_NEW_VERSION = { name: PLUGIN_NAME, version: '1.0.0' };

const REFRESH_WEB_CONSOLE_TEST_ID = 'refresh-web-console';

test.describe('PollConsoleUpdates', { tag: ['@admin'] }, () => {
  test('triggers console update toast when consoleCommit changes', async ({ page }) => {
    let updateCount = 0;

    await page.route(CHECK_UPDATES_URL, (route) => {
      updateCount++;
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(updateCount <= 1 ? UPDATES_DEFAULT : UPDATES_NEW_COMMIT),
      });
    });

    await page.goto('/');
    const refreshLink = page.getByTestId(REFRESH_WEB_CONSOLE_TEST_ID);
    await expect(refreshLink).toBeVisible({ timeout: 300_000 });
    await refreshLink.click();
    await expect(refreshLink).not.toBeAttached({ timeout: 30_000 });
  });

  test('triggers console update toast when a plugin is added', async ({ page }) => {
    let updateCount = 0;
    let manifestAvailable = false;

    await page.route(CHECK_UPDATES_URL, (route) => {
      updateCount++;
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(updateCount <= 1 ? UPDATES_DEFAULT : UPDATES_NEW_PLUGIN),
      });
    });

    await page.route(PLUGIN_MANIFEST_URL, (route) => {
      if (!manifestAvailable) {
        route.abort('failed');
      } else {
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(PLUGIN_MANIFEST_DEFAULT),
        });
      }
    });

    await page.goto('/');

    await test.step('wait for first failed manifest fetch', async () => {
      await page.waitForEvent('requestfailed', {
        predicate: (req) => req.url().includes('/plugin-manifest.json'),
        timeout: 60_000,
      });
      const refreshLink = page.getByTestId(REFRESH_WEB_CONSOLE_TEST_ID);
      await expect(refreshLink).not.toBeAttached();
    });

    await test.step('make manifest available and verify toast appears', async () => {
      manifestAvailable = true;
      const refreshLink = page.getByTestId(REFRESH_WEB_CONSOLE_TEST_ID);
      await expect(refreshLink).toBeVisible({ timeout: 300_000 });
      await refreshLink.click();
      await expect(refreshLink).not.toBeAttached({ timeout: 30_000 });
    });
  });

  test.fixme('triggers toast when a plugin is added while another plugin endpoint errors', async ({
    page,
  }) => {
    let manifest2Available = false;

    await page.route(CHECK_UPDATES_URL, (route) => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(UPDATES_NEW_PLUGIN2),
      });
    });

    await page.route(PLUGIN_MANIFEST_URL, (route) => {
      route.abort('failed');
    });

    await page.route(PLUGIN_MANIFEST_URL2, (route) => {
      if (!manifest2Available) {
        route.abort('failed');
      } else {
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(PLUGIN_MANIFEST_DEFAULT2),
        });
      }
    });

    await page.goto('/');

    await test.step('verify no toast while both manifests fail', async () => {
      await page.waitForEvent('requestfailed', {
        predicate: (req) => req.url().includes('/plugin-manifest.json'),
        timeout: 60_000,
      });
      await expect(page.getByTestId(REFRESH_WEB_CONSOLE_TEST_ID)).not.toBeAttached();
    });

    await test.step('make second manifest available and verify toast', async () => {
      manifest2Available = true;
      const refreshLink = page.getByTestId(REFRESH_WEB_CONSOLE_TEST_ID);
      await expect(refreshLink).toBeVisible({ timeout: 300_000 });
      await refreshLink.click();
      await expect(refreshLink).not.toBeAttached({ timeout: 30_000 });
    });
  });

  test('triggers console update toast when a plugin is removed', async ({ page }) => {
    let updateCount = 0;

    await page.route(CHECK_UPDATES_URL, (route) => {
      updateCount++;
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(updateCount <= 1 ? UPDATES_NEW_PLUGIN : UPDATES_DEFAULT),
      });
    });

    await page.route(PLUGIN_MANIFEST_URL, (route) => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(PLUGIN_MANIFEST_DEFAULT),
      });
    });

    await page.goto('/');
    const refreshLink = page.getByTestId(REFRESH_WEB_CONSOLE_TEST_ID);
    await expect(refreshLink).toBeVisible({ timeout: 300_000 });
    await refreshLink.click();
    await expect(refreshLink).not.toBeAttached({ timeout: 30_000 });
  });

  test.fixme('triggers console update toast when a plugin version changes', async ({ page }) => {
    let manifestCount = 0;

    await page.route(CHECK_UPDATES_URL, (route) => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(UPDATES_NEW_PLUGIN),
      });
    });

    await page.route(PLUGIN_MANIFEST_URL, (route) => {
      manifestCount++;
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          manifestCount <= 1 ? PLUGIN_MANIFEST_DEFAULT : PLUGIN_MANIFEST_NEW_VERSION,
        ),
      });
    });

    await page.goto('/');
    const refreshLink = page.getByTestId(REFRESH_WEB_CONSOLE_TEST_ID);
    await expect(refreshLink).toBeVisible({ timeout: 300_000 });
    await refreshLink.click();
    await expect(refreshLink).not.toBeAttached({ timeout: 30_000 });
  });
});
