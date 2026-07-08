import { test, expect } from '../../fixtures';
import type KubernetesClient from '../../clients/kubernetes-client';
import type { CleanupFixture } from '../../fixtures/cleanup-fixture';

const SERVICE_NAME = 'test-service';
const SERVICE_PORT = 8080;

async function createRoutePrerequisites(
  k8sClient: KubernetesClient,
  cleanup: CleanupFixture,
  namespace: string,
): Promise<void> {
  await k8sClient.createNamespace(namespace);
  cleanup.trackNamespace(namespace);

  await k8sClient.createDeployment(namespace, {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: { name: 'test-app', namespace },
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: 'test-app' } },
      template: {
        metadata: { labels: { app: 'test-app' } },
        spec: {
          securityContext: {
            runAsNonRoot: true,
            seccompProfile: { type: 'RuntimeDefault' },
          },
          containers: [
            {
              name: 'test',
              image: 'registry.access.redhat.com/ubi9/ubi-minimal:latest',
              command: ['sleep', '3600'],
              ports: [{ containerPort: SERVICE_PORT }],
              securityContext: {
                allowPrivilegeEscalation: false,
                capabilities: { drop: ['ALL'] },
              },
            },
          ],
        },
      },
    },
  });

  await k8sClient.coreV1Api.createNamespacedService({
    namespace,
    body: {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: SERVICE_NAME, namespace },
      spec: {
        selector: { app: 'test-app' },
        ports: [{ port: SERVICE_PORT, targetPort: SERVICE_PORT, protocol: 'TCP' }],
      },
    },
  });
}

async function createTestRoute(
  k8sClient: KubernetesClient,
  namespace: string,
  routeName: string,
): Promise<void> {
  await k8sClient.createCustomResource('route.openshift.io', 'v1', namespace, 'routes', {
    apiVersion: 'route.openshift.io/v1',
    kind: 'Route',
    metadata: { name: routeName, namespace },
    spec: {
      to: { kind: 'Service', name: SERVICE_NAME },
      port: { targetPort: SERVICE_PORT },
    },
  });
}

// Deferred from batch 1: create route via form UI (Cypress TC01), edit route hostname (Cypress TC02)
test.describe('Route', { tag: ['@dev-console'] }, () => {
  test('verifies route details page', { tag: ['@smoke'] }, async ({ page, k8sClient, cleanup }) => {
    const ns = `aut-routes-details-${Date.now()}`;
    const routeName = 'test-route';

    await test.step('Set up namespace and create route', async () => {
      await createRoutePrerequisites(k8sClient, cleanup, ns);
      await createTestRoute(k8sClient, ns, routeName);
    });

    await test.step('Navigate to route details and verify', async () => {
      await page.goto(`/k8s/ns/${ns}/routes/${routeName}`);
      await expect(page.locator('h1', { hasText: routeName })).toBeVisible({ timeout: 30_000 });
    });
  });

  test('deletes route via Actions menu', { tag: ['@regression'] }, async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-routes-delete-${Date.now()}`;
    const routeName = 'test-route';

    await test.step('Set up namespace and create route', async () => {
      await createRoutePrerequisites(k8sClient, cleanup, ns);
      await createTestRoute(k8sClient, ns, routeName);
    });

    await test.step('Navigate to route details and delete', async () => {
      await page.goto(`/k8s/ns/${ns}/routes/${routeName}`);
      await expect(page.locator('h1', { hasText: routeName })).toBeVisible({ timeout: 30_000 });
      await page.getByRole('button', { name: 'Actions' }).click();
      await page.getByRole('menuitem', { name: 'Delete Route' }).click();
    });

    await test.step('Confirm deletion', async () => {
      await page.getByRole('button', { name: 'Delete', exact: true }).click();
      await expect(page.locator('h1', { hasText: 'Routes' })).toBeVisible({ timeout: 30_000 });
    });
  });
});
