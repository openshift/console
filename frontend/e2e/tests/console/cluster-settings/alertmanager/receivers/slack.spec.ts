import { test, expect } from '../../../../../fixtures';
import {
  AlertmanagerPage,
  getGlobalsAndReceiverConfig,
} from '../../../../../pages/alertmanager-page';
import KubernetesClient from '../../../../../clients/kubernetes-client';
import { resetAlertmanagerConfig } from '../alertmanager-test-utils';

test.describe.configure({ mode: 'serial' });

test.describe('Alertmanager Slack Receiver Form', { tag: ['@admin'] }, () => {
  let alertmanager: AlertmanagerPage;
  let k8sClient: KubernetesClient;

  const receiverName = `SlackReceiver-${Date.now()}`;
  const receiverType = 'slack';
  const configName = `${receiverType}_configs`;
  const label = 'severity = warning';
  const slackAPIURL = 'http://myslackapi';
  const slackChannel = 'myslackchannel';
  const slackIconURL = 'http://slackiconurl';
  const slackUsername = 'slackusername';

  test.beforeEach(async ({ page, k8sClient: client }) => {
    alertmanager = new AlertmanagerPage(page);
    k8sClient = client;
  });

  test.afterEach(async () => {
    await resetAlertmanagerConfig(k8sClient);
  });

  test('creates and edits Slack Receiver correctly', async ({ page }) => {
    await test.step('Create Slack Receiver with basic configuration', async () => {
      await alertmanager.navigateToAlertmanager();
      await alertmanager.createReceiver(receiverName, configName);

      await expect(page.getByTestId('save-as-default')).toBeDisabled();

      await alertmanager.showAdvancedConfiguration();

      // Verify defaults
      await expect(page.getByTestId('send-resolved-alerts')).not.toBeChecked();
      await expect(page.getByTestId('slack-icon-url')).toHaveValue(
        '{{ template "slack.default.iconurl" .}}',
      );
      await expect(page.getByTestId('slack-icon-emoji')).toBeHidden();

      // Switch to Emoji radio and verify
      await page.getByTestId('Emoji-radio-input').click();
      await expect(page.getByTestId('slack-icon-url')).toBeHidden();
      await expect(page.getByTestId('slack-icon-emoji')).toHaveValue(
        '{{ template "slack.default.iconemoji" .}}',
      );

      // Switch back to URL for the test
      await page.getByTestId('URL-radio-input').click();

      await expect(page.getByTestId('slack-username')).toHaveValue(
        '{{ template "slack.default.username" . }}',
      );
      await expect(page.getByTestId('slack-link-names')).not.toBeChecked();

      // Fill required fields
      await page.getByTestId('slack-api-url').fill(slackAPIURL);
      await expect(page.getByTestId('save-as-default')).toBeEnabled();

      await page.getByTestId('slack-channel').fill(slackChannel);
      await page.getByTestId('label-0').fill(label);

      await alertmanager.save();
    });

    await test.step('Verify Slack Receiver was created correctly', async () => {
      await alertmanager.validateReceiverInList(receiverName);

      await alertmanager.navigateToYAMLPage();
      const yamlContent = await alertmanager.getYAMLContent();
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

      expect(configs.globals).not.toHaveProperty('slack_api_url');
      expect(configs.receiverConfig.channel).toBe(slackChannel);
      expect(configs.receiverConfig.api_url).toBe(slackAPIURL);
      // Advanced fields are not saved since they equal their global values
      expect(configs.receiverConfig).not.toHaveProperty('send_resolved');
      expect(configs.receiverConfig).not.toHaveProperty('username');
    });

    await test.step('Save globals and advanced fields', async () => {
      await alertmanager.navigateToEditReceiver(receiverName);

      await expect(page.getByTestId('slack-channel')).toHaveValue(slackChannel);
      await expect(page.getByTestId('save-as-default')).toBeEnabled();
      await expect(page.getByTestId('slack-api-url')).toHaveValue(slackAPIURL);

      await alertmanager.showAdvancedConfiguration();

      await page.getByTestId('send-resolved-alerts').check();

      await page.getByTestId('slack-icon-url').clear();
      await page.getByTestId('slack-icon-url').fill(slackIconURL);

      await page.getByTestId('slack-username').clear();
      await page.getByTestId('slack-username').fill(slackUsername);

      await page.getByTestId('slack-link-names').check();

      await page.getByTestId('save-as-default').check();

      await alertmanager.save();
    });

    await test.step('Verify advanced fields were saved correctly', async () => {
      await alertmanager.navigateToEditReceiver(receiverName);
      await alertmanager.showAdvancedConfiguration();

      await expect(page.getByTestId('send-resolved-alerts')).toBeChecked();
      await expect(page.getByTestId('slack-icon-url')).toHaveValue(slackIconURL);
      await expect(page.getByTestId('slack-icon-emoji')).toBeHidden();
      await expect(page.getByTestId('slack-username')).toHaveValue(slackUsername);
      await expect(page.getByTestId('slack-link-names')).toBeChecked();
    });

    await test.step('Verify YAML has correct global and receiver config', async () => {
      await alertmanager.navigateToYAMLPage();
      const yamlContent = await alertmanager.getYAMLContent();
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

      expect(configs.globals.slack_api_url).toBe(slackAPIURL);
      expect(configs.receiverConfig).not.toHaveProperty('api_url');
      expect(configs.receiverConfig.channel).toBe('myslackchannel');
      expect(configs.receiverConfig.send_resolved).toBe(true);
      expect(configs.receiverConfig.icon_url).toBe(slackIconURL);
      expect(configs.receiverConfig.username).toBe(slackUsername);
      expect(configs.receiverConfig.link_names).toBe(true);
    });
  });
});
