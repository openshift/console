import { test, expect } from '../../fixtures';
import { WebTerminalPage } from '../../pages/web-terminal-page';

const CONSOLE_NAMESPACE = 'openshift-console';

test.describe('Persistent Terminal Sessions (Detach to Cloud Shell)', { tag: ['@regression'] }, () => {
  let webTerminal: WebTerminalPage;
  let testPodName: string;

  test.beforeAll(async ({ k8sClient }) => {
    const pods = await k8sClient.getPods(CONSOLE_NAMESPACE);
    const runningPod = pods.find((p) => p.status?.phase === 'Running' && p.metadata?.name);
    if (!runningPod) {
      throw new Error(`No running pods found in ${CONSOLE_NAMESPACE}`);
    }
    testPodName = runningPod.metadata!.name!;
  });

  test.beforeEach(async ({ page }) => {
    webTerminal = new WebTerminalPage(page);
  });

  test('Detach pod terminal to Cloud Shell drawer', async () => {
    await test.step('Navigate to pod terminal', async () => {
      await webTerminal.navigateToPodTerminal(CONSOLE_NAMESPACE, testPodName);
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
      await webTerminal.navigateToPodTerminal(CONSOLE_NAMESPACE, testPodName);
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
      await webTerminal.navigateToPodTerminal(CONSOLE_NAMESPACE, testPodName);
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
        await webTerminal.navigateToPodTerminal(CONSOLE_NAMESPACE, testPodName);
        await webTerminal.clickDetachButton();
        await webTerminal.waitForDrawerOpen();
      }
      expect(await webTerminal.getDetachedTabCount()).toBe(5);
    });

    await test.step('Verify Detach button is disabled', async () => {
      await webTerminal.navigateToPodTerminal(CONSOLE_NAMESPACE, testPodName);
      await expect(webTerminal.getDetachButton()).toBeDisabled();
    });
  });

  test('Close drawer clears all detached sessions', async () => {
    await test.step('Detach a pod terminal session', async () => {
      await webTerminal.navigateToPodTerminal(CONSOLE_NAMESPACE, testPodName);
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
