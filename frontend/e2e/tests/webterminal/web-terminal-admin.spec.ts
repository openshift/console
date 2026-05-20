import type { Page } from '@playwright/test';

import { test, expect } from '../../fixtures';
import type KubernetesClient from '../../clients/kubernetes-client';
import { WebTerminalPage } from '../../pages/web-terminal-page';
import {
  ensureWebTerminalOperatorInstalled,
  uninstallWebTerminalOperator,
} from './utils/web-terminal-operator';

const DEVWORKSPACE_GROUP = 'workspace.devfile.io';
const DEVWORKSPACE_VERSION = 'v1alpha2';
const DEVWORKSPACE_PLURAL = 'devworkspaces';
const TERMINAL_NAMESPACE = 'openshift-terminal';

async function verifyDevWorkspaceUid(
  page: Page,
  k8sClient: KubernetesClient,
  webTerminal: WebTerminalPage,
  namespace: string,
): Promise<void> {
  await webTerminal.switchPerspective('Administrator');
  await webTerminal.navigateToDevWorkspaceSearch(namespace);
  const terminalRow = page.getByRole('row').filter({ hasText: /terminal/i });
  await expect(terminalRow.first()).toBeVisible({ timeout: 60_000 });
  await terminalRow.first().getByRole('link').first().click();

  const devWsName = await webTerminal.getResourceTitle();
  const devWorkspaces = await k8sClient.listCustomResources(
    DEVWORKSPACE_GROUP,
    DEVWORKSPACE_VERSION,
    namespace,
    DEVWORKSPACE_PLURAL,
  );
  expect(devWorkspaces.length).toBeGreaterThan(0);
  const uid = (devWorkspaces[0] as any).metadata?.uid;
  expect(uid).toBeTruthy();

  await webTerminal.navigateToDevWorkspaceYaml(namespace, devWsName);
  await expect(webTerminal.getMonacoEditor()).toContainText(uid, { timeout: 30_000 });
}

test.describe('Web Terminal for Admin user', () => {
  test.beforeAll(async ({ k8sClient }) => {
    await ensureWebTerminalOperatorInstalled(k8sClient);
  });

  test.beforeEach(async ({ k8sClient }) => {
    const devWorkspaces = await k8sClient.listCustomResources(
      DEVWORKSPACE_GROUP,
      DEVWORKSPACE_VERSION,
      TERMINAL_NAMESPACE,
      DEVWORKSPACE_PLURAL,
    );
    for (const dw of devWorkspaces) {
      const name = (dw as any).metadata?.name;
      if (name) {
        await k8sClient.deleteCustomResource(
          DEVWORKSPACE_GROUP,
          DEVWORKSPACE_VERSION,
          TERMINAL_NAMESPACE,
          DEVWORKSPACE_PLURAL,
          name,
        );
      }
    }
    if (devWorkspaces.length > 0) {
      const deadline = Date.now() + 60_000;
      while (Date.now() < deadline) {
        const remaining = await k8sClient.listCustomResources(
          DEVWORKSPACE_GROUP,
          DEVWORKSPACE_VERSION,
          TERMINAL_NAMESPACE,
          DEVWORKSPACE_PLURAL,
        );
        if (remaining.length === 0) break;
        await new Promise((resolve) => setTimeout(resolve, 2_000));
      }
    }
  });

  test.afterAll(async ({ k8sClient }) => {
    await uninstallWebTerminalOperator(k8sClient);
  });

  test(
    'open and close multiple terminal tabs',
    async ({ page }) => {
      const webTerminal = new WebTerminalPage(page);

      await test.step('Wait for terminal icon and start terminal', async () => {
        await webTerminal.waitForTerminalIconVisible();
        await webTerminal.clickTerminalIcon();
        await webTerminal.clickStartButton();
        await webTerminal.waitForTerminalWindow();
      });

      await test.step('Open 3 additional tabs', async () => {
        await webTerminal.addTerminalTabs(3);
      });

      await test.step('Close the 2nd tab', async () => {
        await webTerminal.closeTerminalTab(1);
      });

      await test.step('Verify 3 tabs remain', async () => {
        const tabCount = await webTerminal.getOpenTabCount();
        expect(tabCount).toEqual(3);
      });

      await test.step('Close terminal drawer', async () => {
        await webTerminal.closeTerminalDrawer();
      });
    },
  );

  // eslint-disable-next-line playwright/expect-expect
  test(
    'start terminal with timeout and verify DevWorkspace',
    async ({ page, k8sClient }) => {
      const webTerminal = new WebTerminalPage(page);

      await test.step('Open terminal with 10-minute timeout', async () => {
        await webTerminal.waitForTerminalIconVisible();
        await webTerminal.clickTerminalIcon();
        await webTerminal.clickAdvancedTimeout();
        await webTerminal.setTimeoutValue('10');
        await webTerminal.clickStartButton();
      });

      await test.step('Verify DevWorkspace UID matches YAML editor', async () => {
        await verifyDevWorkspaceUid(page, k8sClient, webTerminal, TERMINAL_NAMESPACE);
      });
    },
  );

  test(
    'start terminal with defaults and verify DevWorkspace',
    async ({ page, k8sClient }) => {
      const webTerminal = new WebTerminalPage(page);

      await test.step('Open terminal with default settings', async () => {
        await webTerminal.waitForTerminalIconVisible();
        await webTerminal.clickTerminalIcon();
        await webTerminal.clickStartButton();
      });

      await test.step('Verify terminal window is visible', async () => {
        await webTerminal.waitForTerminalWindow();
        await expect(webTerminal.getTerminalWindow()).toBeVisible();
      });

      await test.step('Verify DevWorkspace UID matches YAML editor', async () => {
        await verifyDevWorkspaceUid(page, k8sClient, webTerminal, TERMINAL_NAMESPACE);
      });
    },
  );
});
