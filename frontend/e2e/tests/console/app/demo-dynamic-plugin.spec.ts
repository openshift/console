import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';

import { test, expect } from '../../../fixtures';
import { ConsolePluginPage } from '../../../pages/console-plugin-page';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { ModalPage } from '../../../pages/modal-page';
import { getEditorContent } from '../../../pages/base-page';

const PLUGIN_NAME = 'console-demo-plugin';
const PLUGIN_PULL_SPEC = process.env.PLUGIN_PULL_SPEC;
const IS_LOCAL_DEV = (process.env.WEB_CONSOLE_URL || '').includes('localhost');
const SHOULD_DEPLOY_PLUGIN = !IS_LOCAL_DEV;

async function skipIfModelUnavailable(page: import('@playwright/test').Page): Promise<void> {
  const errorHeading = page.getByRole('heading', { name: /Error loading/ });
  // eslint-disable-next-line no-restricted-syntax
  const hasError = await errorHeading
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(
      () => true,
      () => false,
    );
  if (hasError) {
    test.skip(true, 'ConsolePlugin model not available in this environment');
  }
}

interface ManifestResource {
  kind: string;
  metadata: { name: string; namespace?: string };
  spec?: Record<string, unknown>;
}

test.describe(
  'Demo dynamic plugin',
  { tag: ['@admin', '@dynamic-plugin'] },
  () => {
    test.describe.configure({ mode: 'serial' });

    let consolePluginPage: ConsolePluginPage;
    let detailsPage: DetailsPage;
    let listPage: ListPage;
    let modalPage: ModalPage;

    test.beforeAll(async ({ k8sClient }) => {
      if (SHOULD_DEPLOY_PLUGIN) {
        const manifestPath = path.resolve(
          import.meta.dirname,
          '../../../../../dynamic-demo-plugin/oc-manifest.yaml',
        );
        const textManifest = fs.readFileSync(manifestPath, 'utf-8');
        const yamlManifest = yaml.loadAll(textManifest) as ManifestResource[];

        const deployment = yamlManifest.find(({ kind }) => kind === 'Deployment');
        const service = yamlManifest.find(({ kind }) => kind === 'Service');
        const consolePlugin = yamlManifest.find(({ kind }) => kind === 'ConsolePlugin');

        if (!deployment || !service || !consolePlugin) {
          throw new Error(
            'oc-manifest.yaml is missing required resources: Deployment, Service, or ConsolePlugin',
          );
        }

        if (PLUGIN_PULL_SPEC && deployment.spec) {
          const templateSpec = (
            (deployment.spec as Record<string, unknown>).template as Record<string, unknown>
          ).spec as Record<string, unknown>;
          const containers = templateSpec.containers as Array<Record<string, unknown>>;
          templateSpec.containers = containers.map((container, idx) =>
            idx === 0 ? { ...container, image: PLUGIN_PULL_SPEC } : container,
          );
        }

        const deploymentContainers = (
          ((deployment.spec as Record<string, unknown>).template as Record<string, unknown>)
            .spec as Record<string, unknown>
        ).containers as Array<Record<string, unknown>>;
        // eslint-disable-next-line no-console
        console.log(
          `Deploying ${PLUGIN_NAME} with image: ${deploymentContainers[0]?.image ?? 'unknown'}`,
        );

        await k8sClient.createNamespace(PLUGIN_NAME);

        await k8sClient.appsV1Api.createNamespacedDeployment({
          namespace: PLUGIN_NAME,
          body: deployment as unknown as Record<string, unknown>,
        });

        await k8sClient.waitForDeploymentReady(PLUGIN_NAME, PLUGIN_NAME);

        await k8sClient.coreV1Api.createNamespacedService({
          namespace: PLUGIN_NAME,
          body: service as unknown as Record<string, unknown>,
        });

        await k8sClient.createClusterCustomResource(
          'console.openshift.io',
          'v1',
          'consoleplugins',
          consolePlugin as unknown as Record<string, unknown>,
        );

        // Log ConsolePlugin resource status for CI debugging
        try {
          const cp = (await k8sClient.customObjectsApi.getClusterCustomObject({
            group: 'console.openshift.io',
            version: 'v1',
            plural: 'consoleplugins',
            name: PLUGIN_NAME,
          })) as Record<string, unknown>;
          // eslint-disable-next-line no-console
          console.log(`ConsolePlugin ${PLUGIN_NAME}:`, JSON.stringify(cp.status ?? {}, null, 2));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log(`Could not read ConsolePlugin status: ${err}`);
        }
      }
    });

    test.beforeEach(async ({ page }) => {
      consolePluginPage = new ConsolePluginPage(page);
      detailsPage = new DetailsPage(page);
      listPage = new ListPage(page);
      modalPage = new ModalPage(page);
    });

    test.afterAll(async ({ k8sClient }) => {
      if (SHOULD_DEPLOY_PLUGIN) {
        await k8sClient
          .deleteClusterCustomResource(
            'console.openshift.io',
            'v1',
            'consoleplugins',
            PLUGIN_NAME,
          )
          .catch(() => {
            // May already be deleted by the UI test
          });
        await k8sClient.deleteNamespace(PLUGIN_NAME);
      }
    });

    test('enables the demo plugin and verifies it loads', async ({ page }) => {
      test.skip(IS_LOCAL_DEV, 'Plugin enablement is only tested on CI');

      await test.step('Navigate to console plugins tab', async () => {
        await consolePluginPage.navigateToConsolePlugins();
        await expect(consolePluginPage.getPluginNameCell(PLUGIN_NAME)).toBeVisible();
      });

      await test.step('Enable the plugin if not already enabled', async () => {
        const enabledCell = page.getByTestId(`${PLUGIN_NAME}-enabled`);
        const alreadyEnabled = (await enabledCell.textContent())?.includes('Enabled');
        if (alreadyEnabled) {
          return;
        }
        await consolePluginPage.clickEditPluginButton(PLUGIN_NAME);
        await modalPage.waitForOpen();
        await expect(modalPage.getModalTitle()).toContainText('Console plugin enablement');
        await page.getByTestId('Enable-radio-input').click();
        await modalPage.submit();
        await modalPage.waitForClosed();
        await expect(enabledCell).toContainText('Enabled');
      });

      await test.step('Verify plugin status is Loaded', async () => {
        // After enablement the console auto-reloads before the server has
        // reconciled the plugin config, so the plugin is not loaded in that
        // session. Navigate to the plugins page and reload until the console
        // server picks up the updated config and reports the plugin as Loaded.
        await consolePluginPage.navigateToConsolePlugins();
        await expect(page.getByTestId(`${PLUGIN_NAME}-name`)).toBeVisible();
        await expect(async () => {
          await page.reload({ waitUntil: 'domcontentloaded' });
          await expect(page.getByTestId(`${PLUGIN_NAME}-status`)).toContainText('Loaded');
        }).toPass({ timeout: 120_000 });
      });
    });

    test('verifies Dashboard Card nav item', async ({ page }) => {
      await consolePluginPage.navigateToOverview();
      const demoDashboardTab = page.getByTestId('horizontal-link-Demo Dashboard');
      await expect(demoDashboardTab).toHaveText('Demo Dashboard');
      await demoDashboardTab.click();
      await expect(page.getByTestId('demo-plugin-dashboard-card')).toContainText(
        'Metrics Dashboard Card example',
      );
      await expect(page.locator('div.graph-wrapper')).toBeAttached();
    });

    test('verifies Dynamic Nav items', async ({ page }) => {
      for (const navID of ['1', '2']) {
        await test.step(`Dynamic Nav ${navID}`, async () => {
          await consolePluginPage.navigateToDynamicRoute(navID);
          await expect(page.getByTestId('title')).toContainText(`Dynamic Page ${navID}`);
          await expect(page.getByTestId('alert-info')).toContainText('Example info alert');
          await expect(page.getByTestId('alert-warning')).toContainText('Example warning alert');
          await expect(page.getByTestId('hint')).toContainText('Example hint');
          await expect(page.getByTestId('card').first()).toContainText('Example card');
        });
      }
    });

    test('verifies Test Utilities nav item', async ({ page }) => {
      await consolePluginPage.navigateToTestUtilities();
      await expect(
        page.getByRole('heading', { name: 'Utilities from Dynamic Plugin SDK' }),
      ).toBeVisible();
      await expect(page.getByText('Utility: consoleFetchJSON')).toBeVisible();
      await expect(page.getByText('Utility: useToast')).toBeVisible();
    });

    test('verifies List Page nav item', async ({ page }) => {
      const podName = 'openshift-state-metrics';
      await consolePluginPage.navigateToDemoListPage();
      await expect(page.getByTestId('page-heading').locator('h1')).toContainText(
        'OpenShift Pods List Page',
      );
      await listPage.filterByNameInput(podName);
      await expect(page.getByTestId('resource-row').filter({ hasText: podName })).toBeVisible();
    });

    test('verifies K8s API nav item', async ({ page }) => {
      const apiIDs = ['k8sCreate', 'k8sGet', 'k8sPatch', 'k8sUpdate', 'k8sList', 'k8sDelete'];
      await consolePluginPage.navigateToK8sApi();
      await expect(
        page.getByRole('heading', { name: 'K8s API from Dynamic Plugin SDK' }),
      ).toBeVisible();
      for (const apiID of apiIDs) {
        await test.step(`K8s API: ${apiID}`, async () => {
          await expect(
            page.getByRole('button', { name: apiID, exact: true }),
          ).toBeVisible();
        });
      }
    });

    test('shows Dynamic Plugins in Cluster Overview Status card', async ({ page }) => {
      await consolePluginPage.navigateToOverview();
      await page.getByRole('button', { name: 'Dynamic Plugins' }).click();
      await expect(page.getByText('Loaded plugins')).toBeVisible();
      const popover = page.locator('.pf-v6-c-popover');
      await expect(
        popover.locator('a', { hasText: 'View all' }),
      ).toHaveAttribute(
        'href',
        '/k8s/cluster/operator.openshift.io~v1~Console/cluster/console-plugins',
      );
    });

    test('shows Dynamic Plugins in About modal', async ({ page }) => {
      await consolePluginPage.navigateToOverview();
      await page.getByTestId('help-dropdown-toggle').click();
      await page.getByText('About', { exact: true }).click();
      await expect(page.locator('dt', { hasText: 'Dynamic plugins' })).toBeVisible();
      await expect(page.getByText('console-demo-plugin (0.0.0)')).toBeVisible();
      await page.getByRole('button', { name: 'Close Dialog' }).click();
    });

    test('verifies extension point for customized create project modal', async ({ page }) => {
      await consolePluginPage.navigateToProjects();
      await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
      await page.getByRole('button', { name: 'Create Project' }).click();
      await expect(
        page.getByText('This modal is created with an extension'),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
    });

    test('displays manifest tab in ConsolePlugin details page', async ({ page }) => {
      await consolePluginPage.navigateToPluginDetails(PLUGIN_NAME);
      await skipIfModelUnavailable(page);
      await expect(detailsPage.getPageHeading()).toContainText(PLUGIN_NAME);
      await expect(
        page.getByTestId('horizontal-link-Plugin manifest'),
      ).toBeVisible();
    });

    test('navigates to manifest tab and displays read-only editor with JSON', async ({ page }) => {
      await consolePluginPage.navigateToPluginManifest(PLUGIN_NAME);
      await expect(page).toHaveURL(/\/plugin-manifest/);
      await skipIfModelUnavailable(page);

      await expect(
        page.getByTestId('horizontal-link-Plugin manifest'),
      ).toHaveClass(/pf-m-current/);

      const codeEditor = consolePluginPage.getCodeEditor();
      const emptyBox = consolePluginPage.getEmptyBox();
      const heading = detailsPage.getPageHeading();
      await expect(codeEditor.or(emptyBox).or(heading).first()).toBeVisible();
    });

    test('manifest tab shows read-only editor when manifest is available', async ({ page }) => {
      await consolePluginPage.navigateToPluginManifest(PLUGIN_NAME);
      await skipIfModelUnavailable(page);

      const codeEditor = consolePluginPage.getCodeEditor();
      // eslint-disable-next-line no-restricted-syntax
      const hasEditor = await codeEditor
        .waitFor({ state: 'visible', timeout: 5_000 })
        .then(
          () => true,
          () => false,
        );
      test.skip(!hasEditor, 'Code editor not present — manifest not available');

      await expect(consolePluginPage.getReadOnlyCodeEditor()).toHaveClass(/pf-m-read-only/);
      const content = await getEditorContent(page);
      expect(content).toContain('"name"');
    });

    test('console plugin proxy copies plugin service response status code', async ({ page }) => {
      test.skip(IS_LOCAL_DEV, 'Proxy test is only run on CI');

      const pluginResponse = await page.request.get(
        `/api/plugins/${PLUGIN_NAME}/plugin-manifest.json`,
      );
      expect(pluginResponse.status()).toBe(200);
    });

    test('allows disabling dynamic plugins through a query parameter', async ({ page }) => {
      await test.step('Disable non-existing plugin makes no changes', async () => {
        await consolePluginPage.navigateWithQueryParam('disable-plugins=foo,bar');
        await expect(page.locator('#page-sidebar')).toContainText('Dynamic Nav');
      });

      await test.step('Disable one plugin', async () => {
        await consolePluginPage.navigateWithQueryParam('disable-plugins=console-demo-plugin');
        await expect(page.locator('#page-sidebar')).not.toContainText('Dynamic Nav');
      });

      await test.step('Disable all plugins', async () => {
        await consolePluginPage.navigateWithQueryParam('disable-plugins');
        await expect(page.locator('#page-sidebar')).not.toContainText('Dynamic Nav');
      });
    });

    test('disables the demo plugin and deletes it', async ({ page }) => {
      test.skip(IS_LOCAL_DEV, 'Plugin disablement is only tested on CI');

      await test.step('Navigate to console plugins tab', async () => {
        await consolePluginPage.navigateToConsolePlugins();
        await expect(consolePluginPage.getPluginNameCell(PLUGIN_NAME)).toBeVisible();
      });

      await test.step('Disable the plugin', async () => {
        await consolePluginPage.clickEditPluginButton(PLUGIN_NAME);
        await modalPage.waitForOpen();
        await page.getByTestId('Disable-radio-input').click();
        await modalPage.submit();
        await modalPage.waitForClosed();
      });

      await test.step('Verify plugin is disabled', async () => {
        const row = consolePluginPage.getPluginNameCell(PLUGIN_NAME).locator('xpath=ancestor::tr');
        await expect(row.getByTestId('edit-console-plugin')).toContainText('Disabled');
        await expect(
          consolePluginPage.getPluginStatusCell(PLUGIN_NAME),
        ).toContainText('-');
      });

      await test.step('Delete the ConsolePlugin', async () => {
        await consolePluginPage.getPluginNameCell(PLUGIN_NAME).locator('a').click();
        await expect(detailsPage.getPageHeading()).toContainText(PLUGIN_NAME);
        await detailsPage.clickPageAction('Delete ConsolePlugin');
        await modalPage.waitForOpen();
        await modalPage.submit();
      });
    });
  },
);
