import * as fs from 'fs';
import * as path from 'path';

import yaml from 'js-yaml';

import type KubernetesClient from '../../../clients/kubernetes-client';
import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { MastheadPage } from '../../../pages/masthead-page';
import { ModalPage } from '../../../pages/modal-page';
import { NavPage } from '../../../pages/nav-page';

const PLUGIN_NAME = 'console-demo-plugin';
const PLUGIN_PULL_SPEC = process.env.PLUGIN_PULL_SPEC;
const IS_CI = !!process.env.OPENSHIFT_CI || !!process.env.CI;
const IS_LOCAL = !IS_CI || !PLUGIN_PULL_SPEC;
const MANIFEST_PATH = path.resolve(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'dynamic-demo-plugin',
  'oc-manifest.yaml',
);

async function deployDemoPlugin(k8sClient: KubernetesClient): Promise<void> {
  const textManifest = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  const yamlManifest = yaml.safeLoadAll(textManifest) as Record<string, unknown>[];

  const deployment = yamlManifest.find((doc: any) => doc.kind === 'Deployment') as any;
  const service = yamlManifest.find((doc: any) => doc.kind === 'Service') as any;
  const consolePlugin = yamlManifest.find((doc: any) => doc.kind === 'ConsolePlugin') as any;

  if (PLUGIN_PULL_SPEC) {
    deployment.spec.template.spec.containers[0].image = PLUGIN_PULL_SPEC;
  }

  await k8sClient.createNamespace(PLUGIN_NAME);
  await k8sClient.createDeployment(PLUGIN_NAME, deployment);
  await k8sClient.createService(PLUGIN_NAME, service);
  await k8sClient.createClusterCustomResource(
    'console.openshift.io',
    'v1',
    'consoleplugins',
    consolePlugin,
  );

  await k8sClient.waitForDeploymentReady(PLUGIN_NAME, PLUGIN_NAME, 120_000);
}

async function enableDemoPlugin(
  page: import('@playwright/test').Page,
  enable: boolean,
): Promise<void> {
  const modal = new ModalPage(page);
  const details = new DetailsPage(page);

  await page.goto('/k8s/cluster/operator.openshift.io~v1~Console/cluster/console-plugins');
  await expect(page).toHaveURL(/console-plugins/);

  const pluginNameCell = page.getByTestId(PLUGIN_NAME);
  const row = pluginNameCell.locator('xpath=ancestor::tr');

  const editButton = row.getByTestId('edit-console-plugin');
  await expect(editButton).toContainText(enable ? 'Disabled' : 'Enabled');
  await editButton.click();

  await modal.waitForOpen();
  await expect(page.getByText('Cancel')).toBeVisible();
  await expect(modal.title).toContainText('Console plugin enablement');

  const radioInput = page.getByTestId(enable ? 'Enable-radio-input' : 'Disable-radio-input');
  await radioInput.click();
  await modal.submit();
  await modal.waitForClosed();

  await expect(editButton).toContainText(enable ? 'Enabled' : 'Disabled');

  const statusCell = page.getByTestId(`${PLUGIN_NAME}-status`);
  await expect(statusCell).toContainText(enable ? 'Loaded' : '-', { timeout: 120_000 });

  if (!enable) {
    await pluginNameCell.click();
    await expect(details.heading).toContainText(PLUGIN_NAME);
    await details.clickPageActionFromDropdown('Delete ConsolePlugin');
    await modal.waitForOpen();
    await modal.submit();
  }
}

const skipIfNoDemoPlugin = !IS_CI || !!PLUGIN_PULL_SPEC;

test.describe('Demo dynamic plugin', { tag: ['@admin'] }, () => {
  // Skip the entire suite if we're on CI without a pull spec
  // eslint-disable-next-line no-empty-pattern
  test.skip(() => !skipIfNoDemoPlugin, 'Skipping: CI without PLUGIN_PULL_SPEC');

  test.beforeAll(async ({ browser, k8sClient }) => {
    if (!IS_LOCAL && PLUGIN_PULL_SPEC) {
      await deployDemoPlugin(k8sClient);

      const page = await browser.newPage();
      await page.goto('/');
      await enableDemoPlugin(page, true);
      await page.close();
    } else if (IS_LOCAL) {
      const textManifest = fs.readFileSync(MANIFEST_PATH, 'utf-8');
      const yamlManifest = yaml.safeLoadAll(textManifest) as Record<string, unknown>[];
      const consolePlugin = yamlManifest.find((doc: any) => doc.kind === 'ConsolePlugin') as any;
      try {
        await k8sClient.createClusterCustomResource(
          'console.openshift.io',
          'v1',
          'consoleplugins',
          consolePlugin,
        );
      } catch {
        // may already exist
      }
    }
  });

  test.afterAll(async ({ browser, k8sClient }) => {
    if (!IS_LOCAL && PLUGIN_PULL_SPEC) {
      const page = await browser.newPage();
      await page.goto('/');
      await enableDemoPlugin(page, false);
      await page.close();

      await k8sClient.deleteNamespace(PLUGIN_NAME);
    } else if (IS_LOCAL) {
      await k8sClient.deleteClusterCustomResource(
        'console.openshift.io',
        'v1',
        'consoleplugins',
        PLUGIN_NAME,
      );
    }
  });

  test('Dashboard Card nav item displays metrics card and graph', async ({ page }) => {
    await page.goto('/dashboards');
    const demoDashboardTab = page.getByTestId('horizontal-link-Demo Dashboard');
    await expect(demoDashboardTab).toHaveText('Demo Dashboard');
    await demoDashboardTab.click();

    await expect(page.getByTestId('demo-plugin-dashboard-card')).toContainText(
      'Metrics Dashboard Card example',
    );
    await expect(page.locator('div.graph-wrapper')).toBeAttached();
  });

  test('Dynamic Nav items render expected content', async ({ page }) => {
    const nav = new NavPage(page);
    await page.goto('/');

    for (const id of ['1', '2']) {
      await test.step(`Dynamic Nav ${id}`, async () => {
        await nav.clickNavLink(['Demo Plugin', `Dynamic Nav ${id}`]);
        await expect(page.getByTestId('title')).toContainText(`Dynamic Page ${id}`);
        await expect(page.getByTestId('alert-info')).toContainText('Example info alert');
        await expect(page.getByTestId('alert-warning')).toContainText('Example warning alert');
        await expect(page.getByTestId('hint')).toContainText('Example hint');
        await expect(page.getByTestId('card').first()).toContainText('Example card');
      });
    }
  });

  test('Utilities nav item shows SDK utilities', async ({ page }) => {
    const nav = new NavPage(page);
    await page.goto('/');

    await nav.clickNavLink(['Demo Plugin', 'Test Utilities']);
    await expect(page.getByText('Utilities from Dynamic Plugin SDK')).toBeVisible();
    await expect(page.getByTestId('test-utility-card').first()).toContainText(
      'Utility: consoleFetchJSON',
    );
    await expect(page.getByTestId('test-utility-fetch')).not.toBeEmpty();
  });

  test('List Page nav item shows filtered pods', async ({ page }) => {
    const nav = new NavPage(page);
    const list = new ListPage(page);
    const podName = 'openshift-state-metrics';
    await page.goto('/');

    await nav.clickNavLink(['Demo Plugin', 'List Page']);
    await expect(list.heading).toContainText('OpenShift Pods List Page');
    await page.getByTestId('resource-row').first().waitFor({ state: 'visible' });

    await page.getByTestId('name-filter-input').fill(podName);
    await expect(page.getByTestId('resource-row').filter({ hasText: podName })).toBeVisible();
  });

  test('K8s API nav item runs all API operations', async ({ page }) => {
    const nav = new NavPage(page);
    const apiIDs = ['k8sCreate', 'k8sGet', 'k8sPatch', 'k8sUpdate', 'k8sList', 'k8sDelete'];
    await page.goto('/');

    await nav.clickNavLink(['Demo Plugin', 'K8s API']);
    await expect(page.getByTestId('test-k8sapi-title')).toContainText(
      'K8s API from Dynamic Plugin SDK',
    );

    for (const apiID of apiIDs) {
      await test.step(`Run ${apiID}`, async () => {
        await page.getByRole('button', { name: apiID }).click();
        await expect(page.getByTestId('test-k8api-error')).not.toBeAttached({ timeout: 5_000 });
      });
    }
  });

  test('Dynamic Plugins status card on Cluster Overview', async ({ page }) => {
    await page.goto('/dashboards');
    await page.getByRole('button', { name: 'Dynamic Plugins' }).click();
    await expect(page.getByText('Loaded plugins')).toBeVisible();

    const popover = page.locator('.pf-v6-c-popover');
    const viewAllLink = popover.locator('a', { hasText: 'View all' });
    await expect(viewAllLink).toHaveAttribute(
      'href',
      '/k8s/cluster/operator.openshift.io~v1~Console/cluster/console-plugins',
    );
  });

  test('Dynamic Plugins listed in About modal', async ({ page }) => {
    const masthead = new MastheadPage(page);
    await page.goto('/');

    await masthead.clickMastheadLink('help-dropdown-toggle');
    await page.getByRole('menuitem', { name: 'About' }).click();
    await expect(page.locator('dt', { hasText: 'Dynamic plugins' })).toBeAttached();
    await expect(page.getByText('console-demo-plugin (0.0.0)')).toBeVisible();
    await page.locator('button[aria-label="Close Dialog"]').click();
  });

  test('extension point enables customized create project modal', async ({ page }) => {
    const nav = new NavPage(page);
    await page.goto('/');

    await nav.clickNavLink(['Home', 'Projects']);

    const table = page.getByTestId('data-view-table');
    await table.waitFor({ state: 'visible', timeout: 30_000 });

    await page.getByTestId('item-create').click();
    await expect(page.getByText('This modal is created with an extension')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('ConsolePlugin details page shows manifest tab', async ({ page }) => {
    test.skip(IS_LOCAL, 'ConsolePlugin model not available in off-cluster mode');
    const details = new DetailsPage(page);

    await details.navigateTo(`/k8s/cluster/console.openshift.io~v1~ConsolePlugin/${PLUGIN_NAME}`);
    await expect(details.heading).toContainText(PLUGIN_NAME);

    const tabList = page.locator('[role="tablist"]');
    await expect(tabList.getByText('Plugin manifest')).toBeVisible();
  });

  test('manifest tab displays read-only code editor with JSON content', async ({ page }) => {
    test.skip(IS_LOCAL, 'ConsolePlugin model not available in off-cluster mode');
    const details = new DetailsPage(page);

    await details.navigateTo(
      `/k8s/cluster/console.openshift.io~v1~ConsolePlugin/${PLUGIN_NAME}/plugin-manifest`,
    );
    await expect(page).toHaveURL(/\/plugin-manifest/);

    const tabList = page.locator('[role="tablist"]');
    await expect(tabList.getByText('Plugin manifest').locator('xpath=ancestor::li')).toHaveClass(
      /pf-m-current/,
    );

    await details.waitForLoaded();

    await expect(page.locator('.co-code-editor')).toBeVisible();
    await expect(page.locator('.pf-v6-c-code-editor')).toHaveClass(/pf-m-read-only/);

    const content = await page.evaluate(() => {
      const models = (window as any).monaco?.editor?.getModels?.();
      return models?.[0]?.getValue() ?? '';
    });

    expect(content).toContain('"name"');
    expect(content).toContain('"version"');
  });

  test('console plugin proxy copies service proxy response status code', async ({ page }) => {
    await page.goto('/');

    await test.step('create route for plugin service (skip on localhost)', async () => {
      if (IS_LOCAL) {
        return;
      }
      const createRouteResponse = await page.evaluate(async (pluginName) => {
        const resp = await fetch(
          `/api/kubernetes/apis/route.openshift.io/v1/namespaces/${pluginName}/routes`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiVersion: 'route.openshift.io/v1',
              kind: 'Route',
              metadata: { name: pluginName, namespace: pluginName },
              spec: {
                to: { kind: 'Service', name: pluginName },
                tls: { termination: 'passthrough' },
              },
            }),
          },
        );
        return resp.status;
      }, PLUGIN_NAME);

      expect([200, 201, 409]).toContain(createRouteResponse);
    });

    const proxyResponse = await page.request.get(
      `/api/plugins/${PLUGIN_NAME}/plugin-manifest.json`,
    );
    expect(proxyResponse.status()).toBe(200);
  });

  test('disable-plugins query parameter hides plugin nav items', async ({ page }) => {
    const sidebar = page.locator('#page-sidebar');

    await test.step('disable non-existing plugin makes no changes', async () => {
      await page.goto('/?disable-plugins=foo,bar');
      await expect(sidebar.getByText('Demo Plugin')).toBeAttached();
    });

    await test.step('disable one plugin removes its nav items', async () => {
      await page.goto('/?disable-plugins=console-demo-plugin');
      await expect(sidebar.getByText('Demo Plugin')).not.toBeAttached();
    });

    await test.step('disable all plugins removes nav items', async () => {
      await page.goto('/?disable-plugins');
      await expect(sidebar.getByText('Demo Plugin')).not.toBeAttached();
    });

    await page.goto('/api-explorer');
  });
});
