import { test, expect } from '../../../../../fixtures';
import {
  AlertmanagerPage,
  getGlobalsAndReceiverConfig,
} from '../../../../../pages/alertmanager-page';
import KubernetesClient from '../../../../../clients/kubernetes-client';
import { resetAlertmanagerConfig } from '../alertmanager-test-utils';

test.describe.configure({ mode: 'serial' });

test.describe('Alertmanager Webhook Receiver Form', { tag: ['@admin'] }, () => {
  let alertmanager: AlertmanagerPage;
  let k8sClient: KubernetesClient;

  const receiverName = `WebhookReceiver-${Date.now()}`;
  const receiverType = 'webhook';
  const configName = `${receiverType}_configs`;
  const label = 'severity = warning';
  const webhookURL = 'http://mywebhookurl';
  const updatedWebhookURL = 'http://myupdatedwebhookurl';

  test.beforeEach(async ({ page, k8sClient: client }) => {
    alertmanager = new AlertmanagerPage(page);
    k8sClient = client;
  });

  test.afterEach(async () => {
    await resetAlertmanagerConfig(k8sClient);
  });

  test('creates and edits Webhook Receiver correctly', async ({ page }) => {
    await test.step('Create Webhook Receiver', async () => {
      await alertmanager.navigateToAlertmanager();
      await alertmanager.createReceiver(receiverName, configName);

      await alertmanager.showAdvancedConfiguration();
      await expect(page.getByTestId('send-resolved-alerts')).toBeChecked();

      await page.getByTestId('webhook-url').fill(webhookURL);
      await page.getByTestId('label-0').fill(label);

      await alertmanager.save();
    });

    await test.step('Verify Webhook Receiver was created correctly', async () => {
      await alertmanager.validateReceiverInList(receiverName);

      await alertmanager.navigateToYAMLPage();
      const yamlContent = await alertmanager.getYAMLContent();
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

      expect(configs.receiverConfig.url).toBe(webhookURL);
      expect(configs.receiverConfig).not.toHaveProperty('send_resolved');
    });

    await test.step('Edit Webhook Receiver and save advanced fields', async () => {
      await alertmanager.navigateToEditReceiver(receiverName);

      await expect(page.getByTestId('webhook-url')).toHaveValue(webhookURL);

      await page.getByTestId('webhook-url').clear();
      await page.getByTestId('webhook-url').fill(updatedWebhookURL);

      await alertmanager.showAdvancedConfiguration();
      await page.getByTestId('send-resolved-alerts').uncheck();

      await alertmanager.save();
    });

    await test.step('Verify advanced fields were saved correctly', async () => {
      await alertmanager.navigateToEditReceiver(receiverName);
      await alertmanager.showAdvancedConfiguration();

      await expect(page.getByTestId('send-resolved-alerts')).not.toBeChecked();
    });

    await test.step('Verify YAML has correct config', async () => {
      await alertmanager.navigateToYAMLPage();
      const yamlContent = await alertmanager.getYAMLContent();
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

      expect(configs.receiverConfig.url).toBe(updatedWebhookURL);
      expect(configs.receiverConfig.send_resolved).toBe(false);
    });
  });
});
