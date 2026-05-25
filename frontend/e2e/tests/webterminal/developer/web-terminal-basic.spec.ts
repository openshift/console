import { test, expect } from '../../../fixtures';
import { WebTerminalPage } from '../../../pages/web-terminal-page';
import {
  ensureWebTerminalOperatorInstalled,
  uninstallWebTerminalOperator,
} from '../utils/web-terminal-operator';

const INACTIVITY_MESSAGE = 'The terminal connection has closed due to inactivity.';
const TERMINAL_IDLING_TIMEOUT = Number(process.env.TERMINAL_IDLING_TIMEOUT) || 200_000;
const TEST_NAMESPACE = 'aut-terminal-basic';

test.describe('Web Terminal basic user', () => {
  test.beforeAll(async ({ k8sClient }) => {
    await ensureWebTerminalOperatorInstalled(k8sClient);
  });

  test.beforeEach(async ({ k8sClient, cleanup }) => {
    await k8sClient.createNamespace(TEST_NAMESPACE);
    cleanup.trackNamespace(TEST_NAMESPACE);
  });

  test.afterAll(async ({ k8sClient }) => {
    await uninstallWebTerminalOperator(k8sClient);
  });

  test('open terminal with advanced timeout', async ({ page }) => {
    const webTerminal = new WebTerminalPage(page);

    await test.step('Open terminal with 1-minute timeout', async () => {
      await webTerminal.waitForTerminalIconVisible();
      await webTerminal.clickTerminalIcon();
      await webTerminal.clickAdvancedTimeout();
      await webTerminal.setTimeoutValue('1');
      await webTerminal.clickStartButton();
    });

    await test.step('Verify terminal window is visible', async () => {
      await webTerminal.waitForTerminalWindow();
      await expect(webTerminal.getTerminalWindow()).toBeVisible();
    });

    await test.step('Close terminal session', async () => {
      await webTerminal.closeTerminalSession();
    });
  });

  test('verify Open in new tab button', async ({ page }) => {
    const webTerminal = new WebTerminalPage(page);

    await test.step('Wait for terminal icon and open terminal', async () => {
      await webTerminal.waitForTerminalIconVisible();
      await webTerminal.clickTerminalIcon();
    });

    await test.step('Verify Open in new tab link has target _blank', async () => {
      const newTabLink = webTerminal.getOpenInNewTabLink();
      await expect(newTabLink).toBeVisible();
      await expect(newTabLink).toHaveAttribute('target', '_blank');
    });
  });

  test('inactivity timeout closes terminal', async ({ page }) => {
    test.slow();
    const webTerminal = new WebTerminalPage(page);

    await test.step('Open terminal and wait for terminal window', async () => {
      await webTerminal.waitForTerminalIconVisible();
      await webTerminal.clickTerminalIcon();
      await webTerminal.clickStartButton();
      await webTerminal.waitForTerminalWindow();
      await expect(webTerminal.getTerminalWindow()).toBeVisible();
    });

    await test.step('Wait for inactivity message', async () => {
      await expect(webTerminal.getInactivityMessageArea()).toContainText(INACTIVITY_MESSAGE, {
        timeout: TERMINAL_IDLING_TIMEOUT,
      });
    });

    await test.step('Verify restart button is shown', async () => {
      const restartButton = page.getByRole('button', { name: 'Restart terminal' });
      await expect(restartButton).toBeVisible();
    });
  });
});
