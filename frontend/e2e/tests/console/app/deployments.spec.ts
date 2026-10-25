import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { retryOnModelNotFound } from '../../../utils/retry-model-error';

test.describe('Deployment resource details page', () => {
  let ns: string;
  const workloadName = `deployment-test`;

  test.beforeAll(async ({ k8sClient }) => {
    ns = `test-deployments-${Date.now()}`;
    await k8sClient.createNamespace(ns);

    await k8sClient.createDeployment(ns, {
      metadata: { name: workloadName, namespace: ns },
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
    });

    await k8sClient.createCustomResource('autoscaling', 'v1', ns, 'horizontalpodautoscalers', {
      metadata: { name: workloadName, namespace: ns },
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
    await k8sClient.deleteNamespace(ns);
  });

  test('enable autoscale button toggles when clicked', async ({ page }) => {
    const detailsPage = new DetailsPage(page);

    await test.step('Enable autoscale button should exist and be clickable', async () => {
      await detailsPage.navigateToDetailsPage(`/k8s/ns/${ns}/deployments/${workloadName}`);
      await detailsPage.waitForPageLoad();
      await retryOnModelNotFound(page);
      const enableAutoscale = page.getByTestId('enable-autoscale');
      await expect(enableAutoscale).toBeVisible({ timeout: 30_000 });
      await enableAutoscale.click();
    });

    await test.step('Enable autoscale button should not exist after enabling', async () => {
      await detailsPage.navigateToDetailsPage(`/k8s/ns/${ns}/deployments/${workloadName}`);
      await detailsPage.waitForPageLoad();
      await retryOnModelNotFound(page);
      await expect(page.getByTestId('enable-autoscale')).not.toBeAttached({ timeout: 30_000 });
    });
  });
});
