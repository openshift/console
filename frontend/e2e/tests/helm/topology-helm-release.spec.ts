import { test, expect } from '../../fixtures';
import { TopologyPage } from '../../pages/topology-page';
import { TopologySidebarPage } from '../../pages/topology-sidebar-page';

const NS = `aut-helm-topo-${Date.now()}`;
const HELM_RELEASE_NAME = 'nodejs-release';
const HELM_CHART_NAME = 'Nodejs';

/**
 * Installs a Helm chart via the Developer Console UI.
 *
 * Navigates to the Developer catalog, finds the specified Helm chart,
 * and installs it with the given release name in the current namespace.
 */
async function installHelmChart(
  page: import('@playwright/test').Page,
  namespace: string,
  releaseName: string,
  chartName: string,
): Promise<void> {
  const topology = new TopologyPage(page);
  await topology.switchPerspective('Developer');

  // Navigate to the Helm chart catalog for this namespace
  await page.goto(`/catalog/ns/${namespace}?catalogType=HelmChart`, { timeout: 90_000 });
  await expect(page.getByPlaceholder('Filter by keyword')).toBeVisible({ timeout: 60_000 });

  // Search for the chart
  await page.getByPlaceholder('Filter by keyword').fill(chartName);

  // Click the chart card
  const chartCard = page.locator(`[data-test^="HelmChart-"][data-test*="${chartName}"]`).first();
  await chartCard.click({ timeout: 30_000 });

  // In the side panel, click "Install Helm Chart" / "Create" button
  const installButton = page.getByRole('link', { name: /Install Helm Chart|Create/ }).first();
  await installButton.click({ timeout: 30_000 });

  // On the install form, update the release name
  const releaseNameInput = page.getByTestId('helm-form-input-release-name');
  await expect(releaseNameInput).toBeVisible({ timeout: 30_000 });
  await releaseNameInput.clear();
  await releaseNameInput.fill(releaseName);

  // Click Install/Create
  const submitButton = page.getByTestId('submit-button');
  await submitButton.click({ timeout: 30_000 });

  // Wait for redirect to topology
  await expect(page).toHaveURL(new RegExp(`/topology/ns/${namespace}`), { timeout: 120_000 });
}

test.describe(
  'Actions on Helm release in topology page',
  { tag: ['@helm', '@topology'] },
  () => {
    test.beforeAll(async ({ k8sClient }) => {
      await k8sClient.createNamespace(NS);
      await k8sClient.waitForNamespaceReady(NS);
    });

    test.afterAll(async ({ k8sClient }) => {
      await k8sClient.deleteNamespace(NS);
    });

    test('sidebar shows Details, Resources, and Release notes tabs: HR-07-TC01', async ({
      page,
    }) => {
      const topology = new TopologyPage(page);
      const sidebar = new TopologySidebarPage(page);

      await test.step('Install Helm chart', async () => {
        await installHelmChart(page, NS, HELM_RELEASE_NAME, HELM_CHART_NAME);
      });

      await test.step('Open sidebar for the Helm release', async () => {
        await topology.navigateToTopologyGraph(NS);
        await topology.clickOnHelmGroup(HELM_RELEASE_NAME);
        await sidebar.verify();
      });

      await test.step('Verify sidebar tabs', async () => {
        await expect(sidebar.getTab('Details')).toBeVisible();
        await expect(sidebar.getTab('Resources')).toBeVisible();
        await expect(sidebar.getTab('Release notes')).toBeVisible();
      });
    });

    test('resource links in sidebar navigate to correct details pages: HR-07-TC02 through HR-07-TC06', async ({
      page,
    }) => {
      const topology = new TopologyPage(page);
      const sidebar = new TopologySidebarPage(page);

      await test.step('Install Helm chart', async () => {
        await installHelmChart(page, NS, HELM_RELEASE_NAME, HELM_CHART_NAME);
      });

      const resourceTests = [
        { label: 'Deployments', resourceKind: 'Deployment', plural: 'deployments', id: 'HR-07-TC02' },
        { label: 'Build Configs', resourceKind: 'BuildConfig', plural: 'buildconfigs', id: 'HR-07-TC03' },
        { label: 'Services', resourceKind: 'Service', plural: 'services', id: 'HR-07-TC04' },
        { label: 'Image Streams', resourceKind: 'ImageStream', plural: 'imagestreams', id: 'HR-07-TC05' },
        { label: 'Routes', resourceKind: 'Route', plural: 'routes', id: 'HR-07-TC06' },
      ];

      for (const { label, resourceKind, plural, id } of resourceTests) {
        await test.step(`${label} link navigates to ${resourceKind} details page: ${id}`, async () => {
          await topology.navigateToTopologyGraph(NS);
          await topology.clickOnHelmGroup(HELM_RELEASE_NAME);
          await sidebar.verify();
          await sidebar.selectTab('Resources');

          const href = `/k8s/ns/${NS}/${plural}/${HELM_RELEASE_NAME}`;
          await sidebar.clickResourceLink(href);

          // Verify we landed on the resource details page
          const sectionHeading = page.locator(
            `[data-test-section-heading="${resourceKind} details"]`,
          );
          await expect(sectionHeading).toBeVisible({ timeout: 30_000 });
          await expect(sectionHeading).toContainText(`${resourceKind} details`);
        });
      }
    });
  },
);
