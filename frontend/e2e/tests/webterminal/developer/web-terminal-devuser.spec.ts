import type { Page } from '@playwright/test';

import { test, expect } from '../../../fixtures';
import type KubernetesClient from '../../../clients/kubernetes-client';
import { WebTerminalPage } from '../../../pages/web-terminal-page';
import {
  ensureWebTerminalOperatorInstalled,
  uninstallWebTerminalOperator,
} from '../utils/web-terminal-operator';

const DEVWORKSPACE_GROUP = 'workspace.devfile.io';
const DEVWORKSPACE_VERSION = 'v1alpha2';
const DEVWORKSPACE_PLURAL = 'devworkspaces';
const EXISTING_PROJECT = 'aut-terminal-testuser-existed';
const NEW_PROJECT = 'aut-terminal-testuser';

async function verifyDevWorkspaceRunning(
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

  const devWorkspaces = await k8sClient.listCustomResources(
    DEVWORKSPACE_GROUP,
    DEVWORKSPACE_VERSION,
    namespace,
    DEVWORKSPACE_PLURAL,
  );
  expect(devWorkspaces.length).toBeGreaterThan(0);
  const phase = (devWorkspaces[0] as any).status?.phase;
  expect(phase).toBe('Running');
}

test.describe('Web Terminal for Developer user', () => {
  test.beforeAll(async ({ k8sClient }) => {
    await ensureWebTerminalOperatorInstalled(k8sClient);
  });

  test.beforeEach(async ({ k8sClient, cleanup }) => {
    await k8sClient.createNamespace(EXISTING_PROJECT);
    cleanup.trackNamespace(EXISTING_PROJECT);
  });

  test.afterAll(async ({ k8sClient }) => {
    await uninstallWebTerminalOperator(k8sClient);
  });

  test(
    'create new project and use Web Terminal',
    async ({ page, k8sClient, cleanup }) => {
      const webTerminal = new WebTerminalPage(page);
      cleanup.trackNamespace(NEW_PROJECT);

      await test.step('Wait for terminal icon', async () => {
        await webTerminal.waitForTerminalIconVisible();
      });

      await test.step('Create new project from terminal init screen', async () => {
        await webTerminal.clickTerminalIcon();
        await webTerminal.clickProjectDropdown();
        await webTerminal.selectCreateProject();
        await webTerminal.typeProjectName(NEW_PROJECT);
        await webTerminal.confirmProjectCreation();
      });

      await test.step('Set timeout and start terminal', async () => {
        await webTerminal.clickAdvancedTimeout();
        await webTerminal.setTimeoutValue('1');
        await webTerminal.clickStartButton();
      });

      await test.step('Verify terminal window is visible', async () => {
        await webTerminal.waitForTerminalWindow();
        await expect(webTerminal.getTerminalWindow()).toBeVisible();
      });

      await test.step('Verify DevWorkspace is running in developer namespace', async () => {
        await verifyDevWorkspaceRunning(page, k8sClient, webTerminal, NEW_PROJECT);
      });
    },
  );

  // eslint-disable-next-line playwright/expect-expect
  test('open Web Terminal for existing project', async ({ page, k8sClient }) => {
    const webTerminal = new WebTerminalPage(page);

    await test.step('Wait for terminal icon and open terminal', async () => {
      await webTerminal.waitForTerminalIconVisible();
      await webTerminal.clickTerminalIcon();
    });

    await test.step('Select existing project and start terminal', async () => {
      await webTerminal.clickProjectDropdown();
      await webTerminal.selectProjectFromDropdown(EXISTING_PROJECT);
      await webTerminal.clickStartButton();
    });

    await test.step('Verify DevWorkspace is running in existing namespace', async () => {
      await verifyDevWorkspaceRunning(page, k8sClient, webTerminal, EXISTING_PROJECT);
    });
  });
});
