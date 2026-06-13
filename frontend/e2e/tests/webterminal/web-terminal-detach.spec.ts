import * as k8s from '@kubernetes/client-node';

import { test, expect } from '../../fixtures';
import { WebTerminalPage } from '../../pages/web-terminal-page';
import { ensureWebTerminalOperatorInstalled } from './utils/web-terminal-operator';

const TEST_NAMESPACE = 'aut-terminal-detach';
const POD_NAME = 'detach-test-pod';

async function ensureTestPod(k8sClient: import('../../clients/kubernetes-client').default): Promise<void> {
  const pods = await k8sClient.getPods(TEST_NAMESPACE);
  if (pods.some((p) => p.metadata?.name === POD_NAME && p.status?.phase === 'Running')) {
    return;
  }
  const pod: k8s.V1Pod = {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: { name: POD_NAME, namespace: TEST_NAMESPACE },
    spec: {
      containers: [
        {
          name: 'main',
          image: 'registry.access.redhat.com/ubi9/ubi-minimal:9.4',
          command: ['sleep', '3600'],
        },
      ],
    },
  };
  await k8sClient.createPod(pod);
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const current = await k8sClient.getPods(TEST_NAMESPACE);
    const found = current.find((p) => p.metadata?.name === POD_NAME);
    if (found?.status?.phase === 'Running') return;
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }
  throw new Error(`Pod ${POD_NAME} did not reach Running state`);
}

test.describe('Persistent Terminal Sessions (Detach to Cloud Shell)', { tag: ['@regression'] }, () => {
  let webTerminal: WebTerminalPage;

  test.beforeAll(async ({ k8sClient }) => {
    await ensureWebTerminalOperatorInstalled(k8sClient);
    await k8sClient.createNamespace(TEST_NAMESPACE);
    await ensureTestPod(k8sClient);
  });

  test.beforeEach(async ({ page }) => {
    webTerminal = new WebTerminalPage(page);
  });

  test.afterAll(async ({ k8sClient }) => {
    try {
      await k8sClient.deletePod(POD_NAME, TEST_NAMESPACE);
    } catch {
      // Ignore cleanup errors
    }
    try {
      await k8sClient.deleteNamespace(TEST_NAMESPACE);
    } catch {
      // Ignore cleanup errors
    }
  });

  test('Detach pod terminal to Cloud Shell drawer', async () => {
    await test.step('Navigate to pod terminal', async () => {
      await webTerminal.navigateToPodTerminal(TEST_NAMESPACE, POD_NAME);
    });

    await test.step('Click Detach to Cloud Shell button', async () => {
      await webTerminal.clickDetachButton();
    });

    await test.step('Verify Cloud Shell drawer opens with detached tab', async () => {
      await webTerminal.waitForDrawerOpen();
      const tabCount = await webTerminal.getDetachedTabCount();
      expect(tabCount).toBe(1);
    });
  });

  test('Detached session persists across navigation', async () => {
    await test.step('Detach a pod terminal session', async () => {
      await webTerminal.navigateToPodTerminal(TEST_NAMESPACE, POD_NAME);
      await webTerminal.clickDetachButton();
      await webTerminal.waitForDrawerOpen();
      expect(await webTerminal.getDetachedTabCount()).toBe(1);
    });

    await test.step('Navigate to a different page', async () => {
      await webTerminal.page.goto('/k8s/cluster/projects');
      await webTerminal.page.waitForURL(/\/projects/);
    });

    await test.step('Verify detached session still exists', async () => {
      expect(await webTerminal.getDetachedTabCount()).toBe(1);
    });
  });

  test('Close a detached session tab', async () => {
    await test.step('Detach a pod terminal session', async () => {
      await webTerminal.navigateToPodTerminal(TEST_NAMESPACE, POD_NAME);
      await webTerminal.clickDetachButton();
      await webTerminal.waitForDrawerOpen();
      expect(await webTerminal.getDetachedTabCount()).toBe(1);
    });

    await test.step('Close the detached tab', async () => {
      await webTerminal.closeDetachedTab(0);
    });

    await test.step('Verify tab is removed', async () => {
      await expect(webTerminal.getDetachedTabs()).toHaveCount(0);
    });
  });

  test('Session limit prevents more than five detached sessions', async () => {
    await test.step('Detach five terminal sessions', async () => {
      for (let i = 0; i < 5; i++) {
        await webTerminal.navigateToPodTerminal(TEST_NAMESPACE, POD_NAME);
        await webTerminal.clickDetachButton();
        await webTerminal.waitForDrawerOpen();
      }
      expect(await webTerminal.getDetachedTabCount()).toBe(5);
    });

    await test.step('Verify Detach button is disabled', async () => {
      await webTerminal.navigateToPodTerminal(TEST_NAMESPACE, POD_NAME);
      await expect(webTerminal.getDetachButton()).toBeDisabled();
    });
  });

  test('Close drawer clears all detached sessions', async () => {
    await test.step('Detach a pod terminal session', async () => {
      await webTerminal.navigateToPodTerminal(TEST_NAMESPACE, POD_NAME);
      await webTerminal.clickDetachButton();
      await webTerminal.waitForDrawerOpen();
      expect(await webTerminal.getDetachedTabCount()).toBe(1);
    });

    await test.step('Close the Cloud Shell drawer', async () => {
      await webTerminal.closeTerminalDrawer();
    });

    await test.step('Reopen drawer and verify no detached sessions', async () => {
      await webTerminal.clickTerminalIcon();
      await expect(webTerminal.getDetachedTabs()).toHaveCount(0);
    });
  });
});
