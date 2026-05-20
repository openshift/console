import { test, expect } from '../../fixtures';
import KubernetesClient from '../../clients/kubernetes-client';
import { PerspectivePage } from '../../pages/dev-console/perspective-page';
import { HealthChecksPage } from '../../pages/dev-console/health-checks-page';

test.describe('Perform Health Checks related Actions', { tag: ['@smoke', '@dev-console'] }, () => {
  const namespace = `aut-monitoring-sidebar-${Date.now()}`;
  let k8s: KubernetesClient;

  test.beforeAll(async () => {
    k8s = new KubernetesClient({
      clusterUrl: process.env.CLUSTER_URL || '',
      username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
      password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
    });
    await k8s.createNamespace(namespace);

    const deployments = ['health-checks-d', 'http-d', 'tcp-d', 'command-d'];

    for (const name of deployments) {
      await k8s.appsV1Api.createNamespacedDeployment({
        namespace,
        body: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: { name, namespace },
          spec: {
            replicas: 1,
            selector: { matchLabels: { app: name } },
            template: {
              metadata: { labels: { app: name } },
              spec: {
                containers: [
                  {
                    name,
                    image: 'registry.access.redhat.com/ubi8/nodejs-18:latest',
                    ports: [{ containerPort: 8080, protocol: 'TCP' }],
                  },
                ],
              },
            },
          },
        },
      });
    }
  });

  test.afterAll(async () => {
    await k8s.deleteNamespace(namespace);
  });

  test('add health checks page', async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);

    await test.step('Navigate to topology', async () => {
      await page.goto('/');
      await perspectivePage.switchToDeveloper();
      await perspectivePage.selectOrCreateProject(namespace);
      await perspectivePage.navigateToTopology();
    });

    await test.step('Open workload sidebar and select Add Health Checks', async () => {
      const searchInput = page.locator('[data-test-id="item-filter"]');
      await searchInput.fill('health-checks-d');
      const node = page.locator('[data-test-id="health-checks-d"]').first();
      await node.click();
      const actionsDropdown = page.locator('[data-test-id="actions-menu-button"]');
      await actionsDropdown.click();
      await page.locator('[data-test-action="Add Health Checks"]').click();
    });

    await test.step('Verify health checks page', async () => {
      await expect(page.locator('[data-test="page-heading"] h1')).toContainText('health checks', {
        ignoreCase: true,
      });
    });
  });

  for (const { workloadName, probeType } of [
    { workloadName: 'http-d', probeType: 'HTTP GET' },
    { workloadName: 'tcp-d', probeType: 'TCP socket' },
    { workloadName: 'command-d', probeType: 'Container command' },
  ]) {
    test(`add all 3 health checks to deployment: ${probeType}`, async ({ page }) => {
      const perspectivePage = new PerspectivePage(page);
      const healthChecksPage = new HealthChecksPage(page);

      await test.step('Navigate to topology', async () => {
        await page.goto('/');
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
        await perspectivePage.navigateToTopology();
      });

      await test.step('Open workload sidebar', async () => {
        const searchInput = page.locator('[data-test-id="item-filter"]');
        await searchInput.fill(workloadName);
        const node = page.locator(`[data-test-id="${workloadName}"]`).first();
        await node.click();
      });

      await test.step('Select Add Health Checks from actions', async () => {
        const actionsDropdown = page.locator('[data-test-id="actions-menu-button"]');
        await actionsDropdown.click();
        await page.locator('[data-test-action="Add Health Checks"]').click();
      });

      await test.step('Add readiness probe', async () => {
        await healthChecksPage.clickAddProbe('Add Readiness Probe');
        await healthChecksPage.selectProbeType(probeType);
        await healthChecksPage.clickCheckIcon();
      });

      await test.step('Add liveness probe', async () => {
        await healthChecksPage.clickAddProbe('Add Liveness Probe');
        await healthChecksPage.selectProbeType(probeType);
        await healthChecksPage.clickCheckIcon();
      });

      await test.step('Add startup probe', async () => {
        await healthChecksPage.clickAddProbe('Add Startup Probe');
        await healthChecksPage.selectProbeType(probeType);
        await healthChecksPage.clickCheckIcon();
      });

      await test.step('Save and verify', async () => {
        await healthChecksPage.clickAddButton();
        await page.waitForURL(/\/topology\//);
      });

      await test.step('Verify all 3 probes added', async () => {
        await page.goto(
          `/k8s/ns/${namespace}/deployments/${workloadName}/containers/${workloadName}/health-checks`,
        );
        await healthChecksPage.expectEditHealthChecksTitle();
        await healthChecksPage.expectProbesAdded(3);
      });
    });
  }

  test('add health check from context menu', { tag: ['@regression'] }, async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const healthChecksPage = new HealthChecksPage(page);

    await test.step('Navigate to topology', async () => {
      await page.goto('/');
      await perspectivePage.switchToDeveloper();
      await perspectivePage.selectOrCreateProject(namespace);
      await perspectivePage.navigateToTopology();
    });

    await test.step('Right-click workload and select Add Health Checks', async () => {
      const searchInput = page.locator('[data-test-id="item-filter"]');
      await searchInput.fill('health-checks-d');
      const node = page.locator('[data-test-id="health-checks-d"]').first();
      await node.click({ button: 'right' });
      await page.locator('[data-test-action="Add Health Checks"]').click();
    });

    await test.step('Add readiness probe', async () => {
      await healthChecksPage.clickAddProbe('Add Readiness Probe');
      await healthChecksPage.selectProbeType('HTTP GET');
      await healthChecksPage.clickCheckIcon();
    });

    await test.step('Save and verify', async () => {
      await healthChecksPage.clickAddButton();
      await page.waitForURL(/\/topology\//);
    });

    await test.step('Verify readiness probe added', async () => {
      await page.goto(
        `/k8s/ns/${namespace}/deployments/health-checks-d/containers/health-checks-d/health-checks`,
      );
      await healthChecksPage.expectEditHealthChecksTitle();
      await healthChecksPage.expectProbeAdded('Readiness probe added');
    });
  });
});
