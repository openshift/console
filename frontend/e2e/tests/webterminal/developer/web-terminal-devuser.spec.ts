import type { Page } from '@playwright/test';

import { test, expect } from '../../../fixtures';
import type KubernetesClient from '../../../clients/kubernetes-client';
import { WebTerminalPage } from '../../../pages/web-terminal-page';
import {
  ensureWebTerminalOperatorInstalled,
  TERMINAL_NAMESPACE_PREFERENCE,
} from '../utils/web-terminal-operator';

const DEVWORKSPACE_GROUP = 'workspace.devfile.io';
const DEVWORKSPACE_VERSION = 'v1alpha2';
const DEVWORKSPACE_PLURAL = 'devworkspaces';
const EXISTING_PROJECT = 'aut-terminal-testuser-existed';
const NEW_PROJECT = 'aut-terminal-testuser';
const DEVELOPER_USERNAME = process.env.BRIDGE_HTPASSWD_USERNAME || 'test';

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
    // The console remembers the last namespace a terminal ran in. These specs
    // delete their namespaces, so a stale preference makes the next terminal
    // watch a namespace that no longer exists and render "Restricted access".
    await k8sClient.clearUserSettings(DEVELOPER_USERNAME, [TERMINAL_NAMESPACE_PREFERENCE]);
    // runLevelZero: false — the DevWorkspace pod must pass the namespace's
    // enforced `restricted` Pod Security level, which needs SCC admission left
    // on so it can inject seccompProfile.
    await k8sClient.createNamespace(EXISTING_PROJECT, undefined, { runLevelZero: false });
    cleanup.trackNamespace(EXISTING_PROJECT);
    // k8sClient is cluster-admin, the browser is the htpasswd developer user.
    // Without an explicit binding the namespace never shows up in that user's
    // project list, so the terminal setup form cannot select it.
    await k8sClient.grantNamespaceAccess(EXISTING_PROJECT, DEVELOPER_USERNAME);
  });

  test('create new project and use Web Terminal', async ({ page, k8sClient, cleanup }) => {
    const webTerminal = new WebTerminalPage(page);
    cleanup.trackNamespace(NEW_PROJECT);

    await test.step('Wait for terminal icon', async () => {
      await webTerminal.waitForTerminalIconVisible();
    });

    // No confirmation step: the terminal setup form creates the ProjectRequest
    // itself on submit, so the project only exists once Start is clicked below.
    await test.step('Name a new project on the terminal init screen', async () => {
      await webTerminal.clickTerminalIcon();
      await webTerminal.clickProjectDropdown();
      await webTerminal.selectCreateProject();
      await webTerminal.typeProjectName(NEW_PROJECT);
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
  });

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
