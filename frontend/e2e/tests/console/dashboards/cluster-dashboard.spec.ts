import * as fs from 'fs';
import { createRequire } from 'module';

import { test, expect } from '../../../fixtures';
import { ClusterDashboardPage } from '../../../pages/cluster-dashboard-page';

// The SDK module loads as CommonJS, while these tests run as ES modules.
const require = createRequire(import.meta.url);

// Purposely escaping e2e tsconfig scope into actual console code, to avoid duplicating this list
const sharedPluginModules: string[] =
  require('../../../../packages/console-dynamic-plugin-sdk/src/shared-modules/shared-modules-meta').sharedPluginModules;

test.describe('Cluster Dashboard', { tag: ['@admin', '@smoke'] }, () => {
  let dashboard: ClusterDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new ClusterDashboardPage(page);
    await dashboard.navigateToDashboard();
  });

  test.describe('Details Card', () => {
    test('has all fields populated', async () => {
      await expect(dashboard.getDetailsCard()).toBeVisible();

      const expectedTitles = [
        'Cluster API address',
        'Cluster ID',
        'Infrastructure provider',
        'OpenShift version',
        'Service Level Agreement (SLA)',
        'Update channel',
      ];

      await expect(dashboard.getDetailItemTitle()).toHaveCount(expectedTitles.length);

      for (let i = 0; i < expectedTitles.length; i++) {
        await expect(dashboard.getDetailItemTitle().nth(i)).toHaveText(expectedTitles[i]);
      }

      await expect(dashboard.getDetailItemValue()).toHaveCount(expectedTitles.length);
      await expect(dashboard.getDetailItemValue().nth(0)).toContainText('https://');
      await expect(dashboard.getDetailItemValue().nth(1)).toContainText('-');
      await expect(dashboard.getDetailItemValue().nth(2)).not.toBeEmpty();
      await expect(dashboard.getDetailItemValue().nth(3)).toContainText('.');
      await expect(dashboard.getDetailItemValue().nth(4)).not.toBeEmpty();
      await expect(dashboard.getDetailItemValue().nth(5)).not.toBeEmpty();
    });

    test('has View settings link', async () => {
      await expect(dashboard.getViewSettingsLink()).toBeVisible();
      await expect(dashboard.getViewSettingsLink()).toHaveAttribute('href', '/settings/cluster/');
    });
  });

  test.describe('Status Card', () => {
    test('has View alerts link', async () => {
      await expect(dashboard.getViewAlertsLink()).toBeVisible();
      await expect(dashboard.getViewAlertsLink()).toHaveAttribute('href', '/monitoring/alerts');
    });

    test('has health indicators', async () => {
      await dashboard.waitForStatusCardLoaded();
      await expect(dashboard.getStatusCard()).toBeVisible();

      const expectedTitles = ['Cluster', 'Control Plane', 'Operators', 'Dynamic Plugins'];
      for (const title of expectedTitles) {
        await expect(dashboard.getStatusCard().getByTestId(title).first()).toContainText(title);
      }
    });
  });

  test.describe('Inventory Card', () => {
    test('has all items', async () => {
      await expect(dashboard.getInventoryCard()).toBeVisible();

      const inventoryItems = [
        { title: 'Node', link: '/k8s/cluster/nodes' },
        { title: 'Pod', link: '/k8s/all-namespaces/pods' },
        { title: 'StorageClass', link: '/k8s/cluster/storageclasses' },
        { title: 'PersistentVolumeClaim', link: '/k8s/all-namespaces/persistentvolumeclaims' },
      ];

      for (let i = 0; i < inventoryItems.length; i++) {
        await expect(dashboard.getResourceInventoryItem().nth(i)).toContainText(
          inventoryItems[i].title,
        );
        await expect(dashboard.getResourceInventoryItem().nth(i)).toHaveAttribute(
          'href',
          inventoryItems[i].link,
        );
      }
    });
  });

  test.describe('Utilization Card', () => {
    test('has all items', async () => {
      await expect(dashboard.getUtilizationCard()).toBeVisible();

      const utilizationItems = ['CPU', 'Memory', 'Filesystem', 'Network transfer', 'Pod count'];
      await expect(dashboard.getUtilizationItem()).toHaveCount(utilizationItems.length);

      for (let i = 0; i < utilizationItems.length; i++) {
        await expect(dashboard.getUtilizationItemTitle().nth(i)).toHaveText(utilizationItems[i]);
      }
    });

    test('has duration dropdown defaulting to 1 hour', async () => {
      await expect(dashboard.getDurationSelect()).toContainText('1 hour');
    });
  });

  test.describe('Dashboard page performance', () => {
    test('records critical rendering path blame timings across repeated loads', async ({
      page,
    }, testInfo) => {
      const runs: { name: string; duration: number }[][] = [];

      for (let i = 0; i < 3; i++) {
        await page.goto('/dashboards?crp-blame', { timeout: 90_000 });
        await expect(dashboard.getDetailsCard()).toBeVisible();
        await dashboard.waitForStatusCardLoaded();

        const measures = await page.evaluate(() =>
          performance
            .getEntriesByType('measure')
            .filter((entry) => entry.name.startsWith('LoadingBox:'))
            .map((entry) => ({ name: entry.name, duration: entry.duration })),
        );
        expect(measures.length).toBeGreaterThan(0);

        // React assigns each LoadingBox mount its own useId, so the same blame
        // label can appear more than once with an identical duration when it
        // renders concurrently (e.g. under StrictMode). Only collapse entries
        // that match on both blame label and duration. Keep entries that share
        // a blame label but have different durations, since those are distinct
        // loading phases (e.g. an initial fallback and a later one).
        const dedupedByBlameAndDuration = new Map<string, { name: string; duration: number }>();
        for (const measure of measures) {
          const blame = measure.name.split('::')[0];
          const key = `${blame}\u0000${measure.duration}`;
          if (!dedupedByBlameAndDuration.has(key)) {
            dedupedByBlameAndDuration.set(key, { name: blame, duration: measure.duration });
          }
        }
        const entries = Array.from(dedupedByBlameAndDuration.values());
        const sum = entries.reduce((total, entry) => total + entry.duration, 0);
        entries.push({ name: 'sum', duration: sum });
        runs.push(entries);
        await page.evaluate(() => performance.clearMarks());
        await page.evaluate(() => performance.clearMeasures());
      }

      const outputFile = testInfo.outputPath('crp-blame-timings.json');
      await fs.promises.writeFile(outputFile, JSON.stringify(runs, null, 2));
      await testInfo.attach('crp-blame-timings', {
        path: outputFile,
        contentType: 'application/json',
      });
    });
  });

  test.describe('Shared scope', () => {
    test('provides the expected singleton shared scope modules', async ({ page }) => {
      await page.goto('/dashboards?debug-mode', { timeout: 90_000 });
      await expect(dashboard.getDetailsCard()).toBeVisible();
      await dashboard.waitForStatusCardLoaded();

      const sharedScope = await page.evaluate(() => (window as any).pluginSharedScope);
      expect(sharedScope).toBeDefined();

      for (const moduleName of sharedPluginModules) {
        expect(sharedScope, `Expected shared scope to have module ${moduleName}`).toHaveProperty(
          moduleName,
        );
        expect(
          Object.keys(sharedScope[moduleName]),
          `Expected keys for module ${moduleName}`,
        ).toHaveLength(1);

        const getSharedModule = (): any =>
          sharedScope[moduleName][Object.keys(sharedScope[moduleName])[0]];

        expect(getSharedModule().from, `Expected from property for module ${moduleName}`).toEqual(
          'openshift-console',
        );
        expect(getSharedModule().eager, `Expected eager property for module ${moduleName}`).toEqual(
          true,
        );
      }
    });
  });
});
