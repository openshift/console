import { test, expect } from '../../fixtures';
import type KubernetesClient from '../../clients/kubernetes-client';
import { PodListPage } from '../../pages/dev-console/pod-list-page';

async function createTestPod(k8sClient: KubernetesClient, ns: string): Promise<void> {
  await k8sClient.createPod({
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: { name: 'test-pod', namespace: ns },
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
          securityContext: {
            allowPrivilegeEscalation: false,
            capabilities: { drop: ['ALL'] },
          },
        },
      ],
    },
  });
}

test.describe('Pod list - Receiving Traffic column', { tag: ['@dev-console', '@regression'] }, () => {
  test('shows Receiving Traffic column for a project', async ({ page, k8sClient, cleanup }) => {
    const ns = `aut-pods-project-${Date.now()}`;
    const podList = new PodListPage(page);

    await test.step('Set up namespace with a pod', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await createTestPod(k8sClient, ns);
    });

    await test.step('Enable Receiving Traffic column and verify', async () => {
      await podList.navigateToPods(ns);
      await podList.showReceivingTrafficColumn();
      await expect(podList.getColumnHeader('Receiving Traffic')).toBeVisible();
    });
  });

  test('shows Receiving Traffic column for all projects', async ({ page, k8sClient, cleanup }) => {
    const ns = `aut-pods-all-${Date.now()}`;
    const podList = new PodListPage(page);

    await test.step('Set up namespace with a pod', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await createTestPod(k8sClient, ns);
    });

    await test.step('Enable Receiving Traffic column and verify', async () => {
      await podList.navigateToPodsAllProjects();
      await podList.showReceivingTrafficColumn();
      await expect(podList.getColumnHeader('Receiving Traffic')).toBeVisible();
    });
  });
});
