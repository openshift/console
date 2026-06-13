import { test, expect } from '../../../../../fixtures';
import {
  AlertmanagerPage,
  getGlobalsAndReceiverConfig,
} from '../../../../../pages/alertmanager-page';
import KubernetesClient from '../../../../../clients/kubernetes-client';

test.describe.configure({ mode: 'serial' });

test.describe('Alertmanager Email Receiver Form', { tag: ['@admin'] }, () => {
  let alertmanager: AlertmanagerPage;
  let k8sClient: KubernetesClient;

  const receiverName = `EmailReceiver-${Date.now()}`;
  const receiverType = 'email';
  const configName = `${receiverType}_configs`;
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

  // Default Alertmanager YAML for reset
  const defaultAlertmanagerYaml = `global:
  resolve_timeout: 5m
inhibit_rules:
- equal:
  - namespace
  - alertname
  source_match:
    severity: critical
  target_match_re:
    severity: warning|info
- equal:
  - namespace
  - alertname
  source_match:
    severity: warning
  target_match_re:
    severity: info
receivers:
- name: Default
- name: Watchdog
- name: Critical
route:
  group_by:
  - namespace
  group_interval: 5m
  group_wait: 30s
  receiver: Default
  repeat_interval: 12h
  routes:
  - matchers:
      - alertname = Watchdog
    receiver: Watchdog
  - matchers:
      - severity = critical
    receiver: Critical`;

  test.beforeEach(async ({ page, k8sClient: client }) => {
    alertmanager = new AlertmanagerPage(page);
    k8sClient = client;
  });

  test.afterEach(async () => {
    // Reset alertmanager configuration
    await k8sClient.patchSecret('alertmanager-main', 'openshift-monitoring', [
      {
        op: 'replace',
        path: '/data/alertmanager.yaml',
        value: Buffer.from(defaultAlertmanagerYaml).toString('base64'),
      },
    ]);
  });

  test('creates and edits Email Receiver correctly', async ({ page }) => {
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
    });

    await test.step('Save fields as global defaults', async () => {
      await alertmanager.navigateToEditReceiver(receiverName);

      const saveAsDefaultCheckbox = page.getByTestId('save-as-default');
      await expect(saveAsDefaultCheckbox).not.toBeChecked();
      await saveAsDefaultCheckbox.check();

      await alertmanager.save();
    });

    await test.step('Verify fields were saved as globals', async () => {
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
    });
  });
});
