import { test, expect } from '../../fixtures';
import KubernetesClient from '../../clients/kubernetes-client';
import { DetailsPage } from '../../pages/details-page';
import { ListPage } from '../../pages/list-page';
import { PerspectivePage } from '../../pages/dev-console/perspective-page';
import { RoutePage } from '../../pages/dev-console/route-page';

test.describe('Route form view', { tag: ['@smoke', '@dev-console'] }, () => {
  const namespace = `aut-routes-${Date.now()}`;
  let k8s: KubernetesClient;

  test.beforeAll(async () => {
    k8s = new KubernetesClient({
      clusterUrl: process.env.CLUSTER_URL || '',
      username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
      password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
    });
    await k8s.createNamespace(namespace);

    await k8s.appsV1Api.createNamespacedDeployment({
      namespace,
      body: {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: 'nodejs-ex-git1', namespace },
        spec: {
          replicas: 1,
          selector: { matchLabels: { app: 'nodejs-ex-git1' } },
          template: {
            metadata: { labels: { app: 'nodejs-ex-git1' } },
            spec: {
              containers: [
                {
                  name: 'nodejs-ex-git1',
                  image: 'registry.access.redhat.com/ubi8/nodejs-18:latest',
                  ports: [{ containerPort: 8080, protocol: 'TCP' }],
                },
              ],
            },
          },
        },
      },
    });

    await k8s.coreV1Api.createNamespacedService({
      namespace,
      body: {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: { name: 'nodejs-ex-git1', namespace },
        spec: {
          selector: { app: 'nodejs-ex-git1' },
          ports: [{ port: 8080, targetPort: 8080, protocol: 'TCP' }],
        },
      },
    });
  });

  test.afterAll(async () => {
    await k8s.deleteNamespace(namespace);
  });

  test('create route using form view', async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const routePage = new RoutePage(page);
    const detailsPage = new DetailsPage(page);

    await test.step('Navigate to Routes', async () => {
      await page.goto('/');
      await perspectivePage.switchToDeveloper();
      await perspectivePage.selectOrCreateProject(namespace);
      await perspectivePage.navigateToRoutes();
    });

    await test.step('Create route', async () => {
      await routePage.clickCreateRoute();
      await routePage.fillName('test-route');
      await routePage.fillHostname('example.com');
      await routePage.selectService('nodejs-ex-git1');
      await routePage.selectTargetPort('8080 → 8080 (TCP)');
      await routePage.submitForm();
    });

    await test.step('Verify route details', async () => {
      await routePage.expectBreadcrumbToContainRoutes();
      await detailsPage.titleShouldContain('test-route');
    });
  });

  test('edit route using form view', { tag: ['@regression'] }, async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const routePage = new RoutePage(page);
    const detailsPage = new DetailsPage(page);
    const listPage = new ListPage(page);

    await test.step('Create a route to edit', async () => {
      await k8s.createCustomResource('route.openshift.io', 'v1', namespace, 'routes', {
        apiVersion: 'route.openshift.io/v1',
        kind: 'Route',
        metadata: { name: 'test-route1', namespace },
        spec: {
          host: 'original.example.com',
          to: { kind: 'Service', name: 'nodejs-ex-git1', weight: 100 },
          port: { targetPort: 8080 },
        },
      });
    });

    await test.step('Navigate to Routes list', async () => {
      await page.goto('/');
      await perspectivePage.switchToDeveloper();
      await perspectivePage.selectOrCreateProject(namespace);
      await perspectivePage.navigateToRoutes();
    });

    await test.step('Open kebab menu and edit route', async () => {
      const row = listPage.resourceRow('test-route1');
      await row.locator('[data-test-id="kebab-button"]').click();
      await page.locator('[data-test-action="Edit Route"]').click({ force: true });
    });

    await test.step('Change hostname and save', async () => {
      await routePage.fillHostname('test.com');
      await routePage.submitForm();
    });

    await test.step('Verify updated route', async () => {
      await detailsPage.titleShouldContain('test-route1');
      await expect(page.locator('[data-test-selector="details-item-value__Host"]')).toContainText(
        'test.com',
      );
    });
  });
});
