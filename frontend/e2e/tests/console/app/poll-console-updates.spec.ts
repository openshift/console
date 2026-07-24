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

// The component uses a prev/current ref pattern: it needs two poll cycles
// (each ~15 s apart) before `stateInitialized` becomes true. This helper
// waits for exactly N mocked check-updates responses, which confirms the
// component has cycled through enough renders for `prevUpdateData` to be
// populated. Call it BEFORE page.goto so the listener catches the first
// response that fires on mount.
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
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_DEFAULT }),
    );

    const ready = waitForResponses(page, 2);
    await page.goto('/');
    await ready;

    // Swap to a new commit hash — the next poll will see the change.
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_COMMIT }),
    );

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 60_000 });
  });

  test('triggers the console update toast when a plugin is added', async ({ page }) => {
    // Phase 1 — baseline: no plugins, no manifest route needed.
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_DEFAULT }),
    );

    const ready = waitForResponses(page, 2);
    await page.goto('/');
    await ready;

    // Phase 2 — announce the plugin but keep its manifest endpoint down.
    // The component should detect pluginsChanged but wait for readiness.
    await page.route(PLUGIN_MANIFEST_URL, (route) => route.abort());
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN }),
    );

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 30_000,
    });

    // Phase 3 — manifest endpoint becomes available → toast should appear.
    await page.route(PLUGIN_MANIFEST_URL, (route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT }),
    );

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 120_000 });
  });

  test('triggers the console update toast when a plugin is added and a different plugin endpoint is erroring', async ({
    page,
  }) => {
    // Baseline: one plugin exists but its manifest is unreachable.
    await page.route(PLUGIN_MANIFEST_URL, (route) => route.abort());
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN }),
    );

    const ready = waitForResponses(page, 2);
    await page.goto('/');
    await ready;

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 30_000,
    });

    // Add a second plugin — both manifests still down.
    await page.route(PLUGIN_MANIFEST_URL2, (route) => route.abort());
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN2 }),
    );

    await page.waitForResponse((resp) => resp.url().includes('/api/check-updates'));

    await expect(page.getByTestId('refresh-web-console')).not.toBeAttached({
      timeout: 30_000,
    });

    // Make plugin2 manifest reachable → toast should appear.
    await page.route(PLUGIN_MANIFEST_URL2, (route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT2 }),
    );

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 120_000 });
  });

  test('triggers the console update toast when a plugin is removed', async ({ page }) => {
    // Baseline: one plugin registered with a working manifest.
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN }),
    );
    await page.route(PLUGIN_MANIFEST_URL, (route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT }),
    );

    const ready = waitForResponses(page, 2);
    await page.goto('/');
    await ready;

    // Remove the plugin from the update response.
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_DEFAULT }),
    );

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 60_000 });
  });

  test('triggers the console update toast when a plugin version changes', async ({ page }) => {
    // Baseline: one plugin at version 0.0.0.
    await page.route(CHECK_UPDATES_URL, (route) =>
      route.fulfill({ json: UPDATES_NEW_PLUGIN }),
    );
    await page.route(PLUGIN_MANIFEST_URL, (route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_DEFAULT }),
    );

    const ready = waitForResponses(page, 2);
    await page.goto('/');
    await ready;

    // Bump the manifest version — the next poll should detect the change.
    await page.route(PLUGIN_MANIFEST_URL, (route) =>
      route.fulfill({ json: PLUGIN_MANIFEST_NEW_VERSION }),
    );

    await expect(page.getByTestId('refresh-web-console')).toBeVisible({ timeout: 120_000 });
  });
});
