import { test, expect } from '../../fixtures';
import { warmupSPA } from '../../pages/base-page';
import { WebTerminalConfigPage } from '../../pages/web-terminal-config-page';
import { ensureWebTerminalOperatorInstalled } from './utils/web-terminal-operator';

const TEST_IMAGE_805 =
  'registry.redhat.io/web-terminal/web-terminal-tooling-rhel8@sha256:9ff1f660fccd3a2f0515ba997d48ad87d2ba47c40b67062c74580bbea9446805';
const TEST_IMAGE_806 =
  'registry.redhat.io/web-terminal/web-terminal-tooling-rhel8@sha256:9ff1f660fccd3a2f0515ba997d48ad87d2ba47c40b67062c74580bbea9446806';

const TEMPLATE_GROUP = 'workspace.devfile.io';
const TEMPLATE_VERSION = 'v1alpha2';
const TEMPLATE_PLURAL = 'devworkspacetemplates';
const OPERATOR_NAMESPACE = 'openshift-operators';
const TEMPLATE_NAMES = ['web-terminal-tooling', 'web-terminal-exec'];

test.describe('Customization of web terminal options', () => {
  // The images above are synthetic digests, and saving them writes straight
  // through to the cluster-wide DevWorkspaceTemplates every web terminal is
  // built from -- both `spec` and the `web-terminal.redhat.com/unmanaged-state`
  // annotation (see customization-utils.ts). Left behind, they make every
  // later terminal — in this suite or any other — fail to start with "Failed
  // to connect", so snapshot both up front and put them back afterwards.
  const originalTemplateSpecs = new Map<string, { spec: unknown; annotations: unknown }>();

  test.beforeAll(async ({ k8sClient }) => {
    await ensureWebTerminalOperatorInstalled(k8sClient);
    const snapshotErrors: string[] = [];
    for (const name of TEMPLATE_NAMES) {
      try {
        const template = (await k8sClient.getCustomResource(
          TEMPLATE_GROUP,
          TEMPLATE_VERSION,
          OPERATOR_NAMESPACE,
          TEMPLATE_PLURAL,
          name,
        )) as { spec?: unknown; metadata?: { annotations?: unknown } };
        if (!template?.spec) {
          throw new Error(`DevWorkspaceTemplate ${name} has no spec`);
        }
        originalTemplateSpecs.set(name, {
          spec: template.spec,
          annotations: template.metadata?.annotations ?? {},
        });
      } catch (err) {
        snapshotErrors.push(`${name}: ${err}`);
      }
    }
    // Without a baseline for every template, cleanup can't fully restore
    // cluster state, so refuse to let tests modify them in the first place.
    if (snapshotErrors.length > 0) {
      throw new Error(`Failed to snapshot DevWorkspaceTemplate(s):\n${snapshotErrors.join('\n')}`);
    }
  });

  test.beforeEach(async ({ page }) => {
    await warmupSPA(page);
  });

  test.afterAll(async ({ k8sClient }) => {
    const restoreErrors: string[] = [];
    for (const [name, { spec, annotations }] of originalTemplateSpecs) {
      try {
        await k8sClient.patchCustomResource(
          TEMPLATE_GROUP,
          TEMPLATE_VERSION,
          OPERATOR_NAMESPACE,
          TEMPLATE_PLURAL,
          name,
          [
            { op: 'replace', path: '/spec', value: spec },
            { op: 'add', path: '/metadata/annotations', value: annotations },
          ],
        );
      } catch (err) {
        restoreErrors.push(`${name}: ${err}`);
      }
    }
    if (restoreErrors.length > 0) {
      throw new Error(`Failed to restore DevWorkspaceTemplate(s):\n${restoreErrors.join('\n')}`);
    }
  });

  test('navigate to Web Terminal Configuration page', async ({ page }) => {
    const configPage = new WebTerminalConfigPage(page);

    await test.step('Navigate to Consoles and open Customize', async () => {
      await configPage.navigateToWebTerminalConfig();
    });

    await test.step('Verify configuration page is visible', async () => {
      await expect(configPage.getConfigSection()).toBeVisible();
    });
  });

  test('change timeout and image with persist checkboxes', async ({ page }) => {
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
  });

  test('change timeout to Hours and verify values persist after tab switch', async ({ page }) => {
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
  });

  test('save without persist checkboxes', async ({ page }) => {
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
  });

  test('verify unchecked checkboxes persist after tab switch', async ({ page }) => {
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
  });

  // eslint-disable-next-line playwright/expect-expect
  test(
    'verify timeout in DevWorkspaceTemplate YAML (manual)',
    {
      annotation: { type: 'skip', description: 'Manual verification required' },
    },
    async () => {
      test.skip(true, 'Manual verification required');
    },
  );

  // eslint-disable-next-line playwright/expect-expect
  test(
    'verify image in DevWorkspaceTemplate YAML (manual)',
    {
      annotation: { type: 'skip', description: 'Manual verification required' },
    },
    async () => {
      test.skip(true, 'Manual verification required');
    },
  );
});
