import { test, expect } from '../../../../../fixtures';
import {
  AlertmanagerPage,
  getGlobalsAndReceiverConfig,
} from '../../../../../pages/alertmanager-page';
import KubernetesClient from '../../../../../clients/kubernetes-client';
import { resetAlertmanagerConfig } from '../alertmanager-test-utils';

test.describe.configure({ mode: 'serial' });

test.describe('Alertmanager PagerDuty Receiver Form', { tag: ['@admin'] }, () => {
  let alertmanager: AlertmanagerPage;
  let k8sClient: KubernetesClient;

  const receiverName = `PagerDutyReceiver-${Date.now()}`;
  const receiverType = 'pagerduty';
  const configName = `${receiverType}_configs`;
  const severity = 'severity';
  const label = `${severity} = warning`;
  const pagerDutyClient = '{{ template "pagerduty.default.client" . }}';
  const pagerDutyClientURL = '{{ template "pagerduty.default.clientURL" . }}';
  const pagerDutyURL1 = 'http://pagerduty-url-specific-to-receiver';
  const pagerDutyURL2 = 'http://global-pagerduty-url';
  const pagerDutyURL3 = 'http://pagerduty-url-specific-to-receiver';
  const clientURL = 'http://updated-client-url';
  const pagerDutyDescription = 'new description';

  test.beforeEach(async ({ page, k8sClient: client }) => {
    alertmanager = new AlertmanagerPage(page);
    k8sClient = client;
    await resetAlertmanagerConfig(k8sClient);
  });

  test.afterEach(async () => {
    await resetAlertmanagerConfig(k8sClient);
  });

  test('creates and edits PagerDuty Receiver correctly', async ({ page }) => {
    test.setTimeout(180_000);

    await test.step('Create PagerDuty Receiver with basic configuration', async () => {
      await alertmanager.navigateToAlertmanager();
      await alertmanager.createReceiver(receiverName, configName);

      await page.getByTestId('integration-key').fill('<integration_key>');

      // Verify default URL
      await expect(page.getByTestId('pagerduty-url')).toHaveValue(
        'https://events.pagerduty.com/v2/enqueue',
      );

      // Check advanced configuration defaults
      await alertmanager.showAdvancedConfiguration();
      await expect(page.getByTestId('send-resolved-alerts')).toBeChecked();
      await expect(page.getByTestId('pagerduty-client')).toHaveValue(pagerDutyClient);
      await expect(page.getByTestId('pagerduty-client-url')).toHaveValue(pagerDutyClientURL);
      await expect(page.getByTestId('pagerduty-description')).toHaveValue(
        '{{ template "pagerduty.default.description" .}}',
      );
      await expect(page.getByTestId('pagerduty-severity')).toHaveValue('error');

      await page.getByTestId('label-0').fill(label);
      await alertmanager.save();
    });

    await test.step('Verify PagerDuty Receiver was created correctly', async () => {
      await alertmanager.validateReceiverInList(receiverName);
    });

    await test.step('Update pagerduty_url', async () => {
      await alertmanager.navigateToEditReceiver(receiverName);

      // Save as default checkbox disabled when url equals global url
      await expect(page.getByTestId('save-as-default')).toBeDisabled();

      // Changing url enables Save as default checkbox
      const urlInput = page.getByTestId('pagerduty-url');
      await urlInput.clear();
      await urlInput.fill(pagerDutyURL1);

      await expect(page.getByTestId('save-as-default')).toBeEnabled();
      await alertmanager.save();
    });

    await test.step('Verify pagerduty_url was saved with Receiver and not global', async () => {
      await alertmanager.navigateToYAMLPage();
      const yamlContent = await alertmanager.getYAMLContent();
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

      expect(configs.globals).not.toHaveProperty('pagerduty_url');
      expect(configs.receiverConfig.url).toBe(pagerDutyURL1);
    });

    await test.step('Save pagerduty_url as global', async () => {
      await alertmanager.navigateToEditReceiver(receiverName);

      const urlInput = page.getByTestId('pagerduty-url');
      await urlInput.clear();
      await urlInput.fill(pagerDutyURL2);

      const saveAsDefaultCheckbox = page.getByTestId('save-as-default');
      await expect(saveAsDefaultCheckbox).toBeEnabled();
      await saveAsDefaultCheckbox.check();

      await alertmanager.save();
    });

    await test.step('Verify pagerduty_url was saved as global', async () => {
      await alertmanager.navigateToYAMLPage();
      const yamlContent = await alertmanager.getYAMLContent();
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

      expect(configs.globals.pagerduty_url).toBe(pagerDutyURL2);
      expect(configs.receiverConfig).not.toHaveProperty('url');
    });

    await test.step('Add pagerduty_url to receiver with existing global', async () => {
      await alertmanager.navigateToEditReceiver(receiverName);

      const urlInput = page.getByTestId('pagerduty-url');
      await urlInput.clear();
      await urlInput.fill(pagerDutyURL3);

      const saveAsDefaultCheckbox = page.getByTestId('save-as-default');
      await expect(saveAsDefaultCheckbox).toBeEnabled();
      await expect(saveAsDefaultCheckbox).not.toBeChecked();

      await alertmanager.save();
    });

    await test.step(
      'Verify pagerduty_url saved with Receiver and global still exists',
      async () => {
        await alertmanager.navigateToYAMLPage();
        const yamlContent = await alertmanager.getYAMLContent();
        const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

        expect(configs.globals.pagerduty_url).toBe(pagerDutyURL2);
        expect(configs.receiverConfig.url).toBe(pagerDutyURL3);
      },
    );

    await test.step('Update advanced configuration fields', async () => {
      await alertmanager.navigateToEditReceiver(receiverName);
      await alertmanager.showAdvancedConfiguration();

      const sendResolvedCheckbox = page.getByTestId('send-resolved-alerts');
      await expect(sendResolvedCheckbox).toBeChecked();
      await sendResolvedCheckbox.uncheck();
      await expect(sendResolvedCheckbox).not.toBeChecked();

      await page.getByTestId('pagerduty-client').clear();
      await page.getByTestId('pagerduty-client').fill('updated-client');

      await page.getByTestId('pagerduty-client-url').clear();
      await page.getByTestId('pagerduty-client-url').fill(clientURL);

      await alertmanager.save();
    });

    await test.step('Verify changed fields are saved with Receiver', async () => {
      await alertmanager.navigateToYAMLPage();
      const yamlContent = await alertmanager.getYAMLContent();
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

      expect(configs.receiverConfig.send_resolved).toBe(false);
      expect(configs.receiverConfig.client).toBe('updated-client');
      expect(configs.receiverConfig.client_url).toBe('http://updated-client-url');
      expect(configs.receiverConfig.description).toBeUndefined();
      expect(configs.receiverConfig.severity).toBeUndefined();
    });

    await test.step('Restore defaults, change desc and severity', async () => {
      await alertmanager.navigateToEditReceiver(receiverName);
      await alertmanager.showAdvancedConfiguration();

      const sendResolvedCheckbox = page.getByTestId('send-resolved-alerts');
      await expect(sendResolvedCheckbox).not.toBeChecked();
      await sendResolvedCheckbox.check();
      await expect(sendResolvedCheckbox).toBeChecked();

      await page.getByTestId('pagerduty-client').clear();
      await page.getByTestId('pagerduty-client').fill(pagerDutyClient);

      await page.getByTestId('pagerduty-client-url').clear();
      await page.getByTestId('pagerduty-client-url').fill(pagerDutyClientURL);

      await page.getByTestId('pagerduty-description').clear();
      await page.getByTestId('pagerduty-description').fill(pagerDutyDescription);

      await page.getByTestId('pagerduty-severity').clear();
      await page.getByTestId('pagerduty-severity').fill(severity);

      await alertmanager.save();
    });

    await test.step('Verify defaults removed from config, desc and severity saved', async () => {
      await alertmanager.navigateToYAMLPage();
      const yamlContent = await alertmanager.getYAMLContent();
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

      expect(configs.receiverConfig.send_resolved).toBeUndefined();
      expect(configs.receiverConfig.client).toBeUndefined();
      expect(configs.receiverConfig.client_url).toBeUndefined();
      expect(configs.receiverConfig.description).toBe(pagerDutyDescription);
      expect(configs.receiverConfig.severity).toBe(severity);
    });
  });
});
