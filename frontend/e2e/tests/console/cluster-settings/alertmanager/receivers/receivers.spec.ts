import { test, expect } from '../../../../../fixtures';
import {
  AlertmanagerPage,
  getGlobalsAndReceiverConfig,
} from '../../../../../pages/alertmanager-page';
import KubernetesClient from '../../../../../clients/kubernetes-client';
import { resetAlertmanagerConfig } from '../alertmanager-test-utils';

test.describe('Alertmanager Receiver Forms', { tag: ['@admin'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let alertmanager: AlertmanagerPage;
  let k8sClient: KubernetesClient;

  test.beforeEach(async ({ page, k8sClient: client }) => {
    alertmanager = new AlertmanagerPage(page);
    k8sClient = client;
    await resetAlertmanagerConfig(k8sClient);
  });

  test.afterEach(async () => {
    await resetAlertmanagerConfig(k8sClient);
  });

  test('creates and edits Webhook Receiver correctly', async ({ page }) => {
    const receiverName = `WebhookReceiver-${Date.now()}`;
    const configName = 'webhook_configs';
    const label = 'severity = warning';
    const webhookURL = 'http://mywebhookurl';
    const updatedWebhookURL = 'http://myupdatedwebhookurl';

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

      await expect(async () => {
        await alertmanager.navigateToYAMLPage();
        const yamlContent = await alertmanager.getYAMLContent();
        const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

        expect(configs.receiverConfig.url).toBe(webhookURL);
        expect(configs.receiverConfig).not.toHaveProperty('send_resolved');
      }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });
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
      await expect(async () => {
        await alertmanager.navigateToYAMLPage();
        const yamlContent = await alertmanager.getYAMLContent();
        const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

        expect(configs.receiverConfig.url).toBe(updatedWebhookURL);
        expect(configs.receiverConfig.send_resolved).toBe(false);
      }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });
    });
  });

  test('creates and edits Email Receiver correctly', async ({ page }) => {
    const receiverName = `EmailReceiver-${Date.now()}`;
    const configName = 'email_configs';
    const localhost = 'localhost';
    const label = 'severity = warning';
    const emailTo = 'you@there.com';
    const emailFrom = 'me@here.com';
    const emailSmarthost = 'smarthost:8080';
    const username = 'username';
    const password = 'password';
    const identity = 'identity';
    const secret = 'secret';
    const html = 'myhtml';

    await test.step('Create Email Receiver with basic configuration', async () => {
      await alertmanager.navigateToAlertmanager();
      await alertmanager.createReceiver(receiverName, configName);

      // Verify defaults before smtp change
      const saveAsDefaultCheckbox = page.getByTestId('save-as-default');
      await expect(saveAsDefaultCheckbox).toBeDisabled();

      const emailHelloInput = page.getByTestId('email-hello');
      await expect(emailHelloInput).toHaveValue(localhost);

      const requireTlsCheckbox = page.getByTestId('email-require-tls');
      await expect(requireTlsCheckbox).toBeChecked();

      // Check advanced configuration defaults
      await alertmanager.showAdvancedConfiguration();
      const sendResolvedCheckbox = page.getByTestId('send-resolved-alerts');
      await expect(sendResolvedCheckbox).not.toBeChecked();

      const emailHtmlInput = page.getByTestId('email-html');
      await expect(emailHtmlInput).toHaveValue('{{ template "email.default.html" . }}');

      // Fill in required fields
      await page.getByTestId('email-to').fill(emailTo);
      await page.getByTestId('email-from').fill(emailFrom);

      // Save as default should now be enabled
      await expect(saveAsDefaultCheckbox).toBeEnabled();

      await page.getByTestId('email-smarthost').fill(emailSmarthost);
      await page.getByTestId('label-0').fill(label);

      await alertmanager.save();
    });

    await test.step('Verify Email Receiver was created correctly', async () => {
      await alertmanager.validateReceiverInList(receiverName);

      await expect(async () => {
        await alertmanager.navigateToYAMLPage();
        const yamlContent = await alertmanager.getYAMLContent();
        const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

        // Verify values are NOT in globals
        expect(configs.globals).not.toHaveProperty('email_to');
        expect(configs.globals).not.toHaveProperty('smtp_from');
        expect(configs.globals).not.toHaveProperty('smtp_smarthost');
        expect(configs.globals).not.toHaveProperty('smtp_require_tls');

        // Verify values ARE in receiver config
        expect(configs.receiverConfig.to).toBe(emailTo);
        expect(configs.receiverConfig.from).toBe(emailFrom);
        expect(configs.receiverConfig.smarthost).toBe(emailSmarthost);
        // require_tls should not be in receiver config (unchanged from global)
        expect(configs.receiverConfig).not.toHaveProperty('require_tls');
      }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });
    });

    await test.step('Edit receiver with auth and advanced fields', async () => {
      await alertmanager.navigateToEditReceiver(receiverName);

      // Verify existing values
      await expect(page.getByTestId('email-to')).toHaveValue(emailTo);

      const saveAsDefaultCheckbox = page.getByTestId('save-as-default');
      await expect(saveAsDefaultCheckbox).toBeEnabled();
      await expect(saveAsDefaultCheckbox).not.toBeChecked();

      await expect(page.getByTestId('email-from')).toHaveValue(emailFrom);
      await expect(page.getByTestId('email-hello')).toHaveValue(localhost);

      // Add auth fields
      await page.getByTestId('email-auth-username').fill(username);
      await page.getByTestId('email-auth-password').fill(password);
      await page.getByTestId('email-auth-identity').fill(identity);
      await page.getByTestId('email-auth-secret').fill(secret);

      // Uncheck require TLS
      await page.getByTestId('email-require-tls').uncheck();

      // Update advanced fields
      await alertmanager.showAdvancedConfiguration();
      await page.getByTestId('send-resolved-alerts').check();

      const htmlInput = page.getByTestId('email-html');
      await htmlInput.clear();
      await htmlInput.fill(html);

      await alertmanager.save();
    });

    await test.step('Verify auth and advanced fields were saved correctly', async () => {
      await expect(async () => {
        await alertmanager.navigateToYAMLPage();
        const yamlContent = await alertmanager.getYAMLContent();
        const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

        // Auth username should NOT be in globals
        expect(configs.globals).not.toHaveProperty('smtp_auth_username');

        // Auth fields should be in receiver config
        expect(configs.receiverConfig.auth_username).toBe(username);
        expect(configs.receiverConfig.auth_password).toBe(password);
        expect(configs.receiverConfig.auth_identity).toBe(identity);
        expect(configs.receiverConfig.auth_secret).toBe(secret);

        // require_tls should now be explicitly false in receiver config
        expect(configs.receiverConfig.require_tls).toBe(false);

        // Advanced fields
        expect(configs.receiverConfig.send_resolved).toBe(true);
        expect(configs.receiverConfig.html).toBe(html);
      }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });
    });

    await test.step('Save fields as global defaults', async () => {
      await alertmanager.navigateToEditReceiver(receiverName);

      const saveAsDefaultCheckbox = page.getByTestId('save-as-default');
      await expect(saveAsDefaultCheckbox).not.toBeChecked();
      await saveAsDefaultCheckbox.check();

      await alertmanager.save();
    });

    await test.step('Verify fields were saved as globals', async () => {
      await expect(async () => {
        await alertmanager.navigateToYAMLPage();
        const yamlContent = await alertmanager.getYAMLContent();
        const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

        // Verify values are now in globals
        expect(configs.globals.smtp_from).toBe(emailFrom);
        expect(configs.globals.smtp_hello).toBe(localhost);
        expect(configs.globals.smtp_smarthost).toBe(emailSmarthost);
        expect(configs.globals.smtp_auth_username).toBe(username);
        expect(configs.globals.smtp_auth_password).toBe(password);
        expect(configs.globals.smtp_auth_identity).toBe(identity);
        expect(configs.globals.smtp_auth_secret).toBe(secret);
        expect(configs.globals.smtp_require_tls).toBe(false);

        // Non-global field (to) should still be in receiver config
        expect(configs.receiverConfig.to).toBe(emailTo);
      }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });
    });
  });

  test('creates and edits Slack Receiver correctly', async ({ page }) => {
    const receiverName = `SlackReceiver-${Date.now()}`;
    const configName = 'slack_configs';
    const label = 'severity = warning';
    const slackAPIURL = 'http://myslackapi';
    const slackChannel = 'myslackchannel';
    const slackIconURL = 'http://slackiconurl';
    const slackUsername = 'slackusername';

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

      await expect(async () => {
        await alertmanager.navigateToYAMLPage();
        const yamlContent = await alertmanager.getYAMLContent();
        const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

        expect(configs.globals).not.toHaveProperty('slack_api_url');
        expect(configs.receiverConfig.channel).toBe(slackChannel);
        expect(configs.receiverConfig.api_url).toBe(slackAPIURL);
        // Advanced fields are not saved since they equal their global values
        expect(configs.receiverConfig).not.toHaveProperty('send_resolved');
        expect(configs.receiverConfig).not.toHaveProperty('username');
      }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });
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
      await expect(async () => {
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
      }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });
    });
  });

  test('creates and edits PagerDuty Receiver correctly', async ({ page }) => {
    test.setTimeout(180_000);

    const receiverName = `PagerDutyReceiver-${Date.now()}`;
    const configName = 'pagerduty_configs';
    const severity = 'severity';
    const label = `${severity} = warning`;
    const pagerDutyClient = '{{ template "pagerduty.default.client" . }}';
    const pagerDutyClientURL = '{{ template "pagerduty.default.clientURL" . }}';
    const pagerDutyURL1 = 'http://pagerduty-url-specific-to-receiver';
    const pagerDutyURL2 = 'http://global-pagerduty-url';
    const pagerDutyURL3 = 'http://pagerduty-url-specific-to-receiver';
    const clientURL = 'http://updated-client-url';
    const pagerDutyDescription = 'new description';

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
      await expect(async () => {
        await alertmanager.navigateToYAMLPage();
        const yamlContent = await alertmanager.getYAMLContent();
        const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

        expect(configs.globals).not.toHaveProperty('pagerduty_url');
        expect(configs.receiverConfig.url).toBe(pagerDutyURL1);
      }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });
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
      await expect(async () => {
        await alertmanager.navigateToYAMLPage();
        const yamlContent = await alertmanager.getYAMLContent();
        const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

        expect(configs.globals.pagerduty_url).toBe(pagerDutyURL2);
        expect(configs.receiverConfig).not.toHaveProperty('url');
      }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });
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
        await expect(async () => {
          await alertmanager.navigateToYAMLPage();
          const yamlContent = await alertmanager.getYAMLContent();
          const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

          expect(configs.globals.pagerduty_url).toBe(pagerDutyURL2);
          expect(configs.receiverConfig.url).toBe(pagerDutyURL3);
        }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });
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
      await expect(async () => {
        await alertmanager.navigateToYAMLPage();
        const yamlContent = await alertmanager.getYAMLContent();
        const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

        expect(configs.receiverConfig.send_resolved).toBe(false);
        expect(configs.receiverConfig.client).toBe('updated-client');
        expect(configs.receiverConfig.client_url).toBe('http://updated-client-url');
        expect(configs.receiverConfig.description).toBeUndefined();
        expect(configs.receiverConfig.severity).toBeUndefined();
      }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });
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
      await expect(async () => {
        await alertmanager.navigateToYAMLPage();
        const yamlContent = await alertmanager.getYAMLContent();
        const configs = getGlobalsAndReceiverConfig(receiverName, configName, yamlContent);

        expect(configs.receiverConfig.send_resolved).toBeUndefined();
        expect(configs.receiverConfig.client).toBeUndefined();
        expect(configs.receiverConfig.client_url).toBeUndefined();
        expect(configs.receiverConfig.description).toBe(pagerDutyDescription);
        expect(configs.receiverConfig.severity).toBe(severity);
      }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });
    });
  });
});
