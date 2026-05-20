import { test, expect } from '../../fixtures';
import { WebTerminalConfigPage } from '../../pages/web-terminal-config-page';
import {
  ensureWebTerminalOperatorInstalled,
  uninstallWebTerminalOperator,
} from './utils/web-terminal-operator';

const TEST_IMAGE_805 =
  'registry.redhat.io/web-terminal/web-terminal-tooling-rhel8@sha256:9ff1f660fccd3a2f0515ba997d48ad87d2ba47c40b67062c74580bbea9446805';
const TEST_IMAGE_806 =
  'registry.redhat.io/web-terminal/web-terminal-tooling-rhel8@sha256:9ff1f660fccd3a2f0515ba997d48ad87d2ba47c40b67062c74580bbea9446806';

test.describe('Customization of web terminal options', () => {
  test.beforeAll(async ({ k8sClient }) => {
    await ensureWebTerminalOperatorInstalled(k8sClient);
  });

  test.afterAll(async ({ k8sClient }) => {
    await uninstallWebTerminalOperator(k8sClient);
  });

  test(
    'navigate to Web Terminal Configuration page',
    async ({ page }) => {
      const configPage = new WebTerminalConfigPage(page);

      await test.step('Navigate to Consoles and open Customize', async () => {
        await configPage.navigateToWebTerminalConfig();
      });

      await test.step('Verify configuration page is visible', async () => {
        await expect(configPage.getConfigSection()).toBeVisible();
      });
    },
  );

  test(
    'change timeout and image with persist checkboxes',
    async ({ page }) => {
      const configPage = new WebTerminalConfigPage(page);

      await test.step('Navigate to Web Terminal Configuration', async () => {
        await configPage.navigateToWebTerminalConfig();
      });

      await test.step('Set timeout to Minutes and enter image', async () => {
        await configPage.incrementTimeout();
        await configPage.selectTimeoutUnit('Minutes');
        await configPage.setImageValue(TEST_IMAGE_805);
      });

      await test.step('Check persist checkboxes and save', async () => {
        await configPage.checkPersistCheckboxes();
        await configPage.clickSaveButton();
      });

      await test.step('Verify success alert', async () => {
        await expect(configPage.getSuccessAlert()).toBeVisible();
      });
    },
  );

  test(
    'change timeout to Hours and verify values persist after tab switch',
    async ({ page }) => {
      const configPage = new WebTerminalConfigPage(page);

      await test.step('Navigate to Web Terminal Configuration', async () => {
        await configPage.navigateToWebTerminalConfig();
      });

      await test.step('Set timeout to Hours, enter image, check persist, and save', async () => {
        await configPage.incrementTimeout();
        await configPage.selectTimeoutUnit('Hours');
        await configPage.setImageValue(TEST_IMAGE_806);
        await configPage.checkPersistCheckboxes();
        await configPage.clickSaveButton();
      });

      await test.step('Re-navigate to Web Terminal Configuration to verify persistence', async () => {
        await configPage.navigateToWebTerminalConfig();
      });

      await test.step('Verify saved values persist', async () => {
        await expect(configPage.getImageInput()).toHaveValue(TEST_IMAGE_806);
        await expect(configPage.getSelectToggle()).toContainText('Hours');
        await expect(configPage.getTimeoutCheckbox()).toBeChecked();
        await expect(configPage.getImageCheckbox()).toBeChecked();
      });
    },
  );

  test(
    'save without persist checkboxes',
    async ({ page }) => {
      const configPage = new WebTerminalConfigPage(page);

      await test.step('Navigate to Web Terminal Configuration', async () => {
        await configPage.navigateToWebTerminalConfig();
      });

      await test.step('Set timeout, image, uncheck persist, and save', async () => {
        await configPage.incrementTimeout();
        await configPage.selectTimeoutUnit('Hours');
        await configPage.setImageValue(TEST_IMAGE_806);
        await configPage.uncheckPersistCheckboxes();
        await configPage.clickSaveButton();
      });

      await test.step('Verify success alert', async () => {
        await expect(configPage.getSuccessAlert()).toBeVisible();
      });
    },
  );

  test(
    'verify unchecked checkboxes persist after tab switch',
    async ({ page }) => {
      const configPage = new WebTerminalConfigPage(page);

      await test.step('Navigate to Web Terminal Configuration', async () => {
        await configPage.navigateToWebTerminalConfig();
      });

      await test.step('Set values, uncheck persist, and save', async () => {
        await configPage.incrementTimeout();
        await configPage.selectTimeoutUnit('Hours');
        await configPage.setImageValue(TEST_IMAGE_806);
        await configPage.uncheckPersistCheckboxes();
        await configPage.clickSaveButton();
      });

      await test.step('Re-navigate to Web Terminal Configuration to verify persistence', async () => {
        await configPage.navigateToWebTerminalConfig();
      });

      await test.step('Verify checkboxes are unchecked', async () => {
        await expect(configPage.getTimeoutCheckbox()).not.toBeChecked();
        await expect(configPage.getImageCheckbox()).not.toBeChecked();
      });
    },
  );

  // eslint-disable-next-line playwright/expect-expect
  test('verify timeout in DevWorkspaceTemplate YAML (manual)', {
    annotation: { type: 'skip', description: 'Manual verification required' },
  }, async () => {
    test.skip(true, 'Manual verification required');
  });

  // eslint-disable-next-line playwright/expect-expect
  test('verify image in DevWorkspaceTemplate YAML (manual)', {
    annotation: { type: 'skip', description: 'Manual verification required' },
  }, async () => {
    test.skip(true, 'Manual verification required');
  });
});
