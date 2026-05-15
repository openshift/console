import { test, expect } from '../../../fixtures';
import KubernetesClient from '../../../clients/kubernetes-client';

test.describe('Events', { tag: ['@admin'] }, () => {
  let k8sClient: KubernetesClient;
  let podName: string;
  let projectName: string;

  test.beforeEach(async ({ k8sClient: client }) => {
    k8sClient = client;

    const timestamp = Date.now();
    podName = `event-test-pod-${timestamp}`;
    projectName = `test-events-${timestamp}`;

    await k8sClient.createNamespace(projectName);

    await k8sClient.createPod({
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        name: podName,
        namespace: projectName,
      },
      spec: {
        securityContext: {
          runAsNonRoot: true,
          seccompProfile: { type: 'RuntimeDefault' },
        },
        containers: [
          {
            name: 'httpd',
            image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest-error',
            securityContext: {
              allowPrivilegeEscalation: false,
              capabilities: { drop: ['ALL'] },
            },
          },
        ],
      },
    });
  });

  test.afterEach(async () => {
    try {
      await k8sClient.deletePod(podName, projectName);
    } catch {
      // Ignore if already deleted
    }
    try {
      await k8sClient.deleteNamespace(projectName);
    } catch {
      // Ignore if already deleted
    }
  });

  test('displays events for a newly created Pod', async ({ page }) => {
    await test.step('Navigate to events page and verify pod events appear', async () => {
      await page.goto(`/k8s/ns/${projectName}/events`);

      await expect(page.getByTestId(podName).first()).toBeVisible({ timeout: 30000 });
    });

    await test.step('Filter events by Warning type', async () => {
      await page.getByTestId('console-select-menu-toggle').click();
      await page.locator('[data-test-dropdown-menu="warning"]').click();

      const totals = page.getByTestId('event-totals');
      await expect(totals).toBeVisible();

      const warnings = page.getByTestId('event-warning');
      await expect(warnings.first()).toBeVisible();
      expect(await warnings.count()).toBeGreaterThan(0);
    });

    await test.step('Filter events by text', async () => {
      await page.getByTestId('item-filter').fill('Error: ImagePullBackOff');

      await expect(page.getByTestId('event-totals')).toContainText('1 event');
      await expect(page.getByTestId('event-warning')).toHaveCount(1);
    });
  });
});
