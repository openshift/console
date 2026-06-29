import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';

test.describe.serial('Deployment resource details page', { tag: ['@admin'] }, () => {
  const testNs = `e2e-deployments-${Date.now()}`;
  const workloadName = `deployment-e2e`;

  test.beforeAll(async ({ k8sClient }) => {
    await k8sClient.createNamespace(testNs);
    await k8sClient.waitForNamespaceReady(testNs);

    await k8sClient.appsV1Api.createNamespacedDeployment({
      namespace: testNs,
      body: {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: workloadName, namespace: testNs },
        spec: {
          replicas: 0,
          selector: { matchLabels: { app: workloadName } },
          template: {
            metadata: { labels: { app: workloadName } },
            spec: {
              containers: [{ name: 'httpd', image: 'httpd' }],
            },
          },
        },
      },
    });

    await k8sClient.createCustomResource('autoscaling', 'v1', testNs, 'horizontalpodautoscalers', {
      apiVersion: 'autoscaling/v1',
      kind: 'HorizontalPodAutoscaler',
      metadata: { name: workloadName, namespace: testNs },
      spec: {
        scaleTargetRef: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: workloadName,
        },
        minReplicas: 1,
        maxReplicas: 10,
      },
    });
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(testNs);
  });

  test('Enable deployment autoscale button should exist', async ({ page }) => {
    const detailsPage = new DetailsPage(page);

    await page.goto(`/k8s/ns/${testNs}/deployments/${workloadName}`);
    await detailsPage.isLoaded();
    await expect(detailsPage.enableAutoscaleButton).toBeVisible();
    await detailsPage.enableAutoscaleButton.click();
  });

  test('Enable deployment autoscale button should not exist', async ({ page }) => {
    const detailsPage = new DetailsPage(page);

    await page.goto(`/k8s/ns/${testNs}/deployments/${workloadName}`);
    await detailsPage.isLoaded();
    await expect(detailsPage.enableAutoscaleButton).toBeHidden({ timeout: 10_000 });
  });
});
