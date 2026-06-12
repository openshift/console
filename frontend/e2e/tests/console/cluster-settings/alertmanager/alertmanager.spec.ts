import { test, expect } from '../../../../fixtures';
import jsYaml from 'js-yaml';
import { AlertmanagerPage } from '../../../../pages/alertmanager-page';
import KubernetesClient from '../../../../clients/kubernetes-client';
import { resetAlertmanagerConfig } from './alertmanager-test-utils';

type AlertmanagerConfig = {
  global?: Record<string, any>;
  receivers?: AlertmanagerReceiver[];
  route: {
    routes?: AlertmanagerRoute[];
    [key: string]: any;
  };
  inhibit_rules?: any[];
};

type AlertmanagerReceiver = {
  name: string;
  [key: string]: any;
};

type AlertmanagerRoute = {
  receiver?: string;
  matchers?: string[];
  [key: string]: any;
};

test.describe.configure({ mode: 'serial' });

// Skipped due to flakes: OCPBUGS-88451
// eslint-disable-next-line playwright/no-skipped-test
test.describe.skip('Alertmanager', { tag: ['@admin'] }, () => {
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

  test('displays the Alertmanager Configuration Details page', async ({ page }) => {
    await page.goto('/settings/cluster');
    await page.getByRole('tab', { name: 'Configuration' }).click();
    await page.getByTestId('Alertmanager').click();
    await expect(page.getByRole('heading', { name: 'Alert routing' })).toBeVisible();
  });

  test('launches Alert Routing modal, edits and saves correctly', async ({ page }) => {
    await alertmanager.navigateToAlertmanager();

    await page.getByTestId('edit-alert-routing-btn').click();

    // Edit routing values (using legacy test IDs)
    await page.locator('[data-test-id="input-group-by"]').fill(', cluster');
    await page.locator('[data-test-id="input-group-wait"]').clear();
    await page.locator('[data-test-id="input-group-wait"]').fill('60s');
    await page.locator('[data-test-id="input-group-interval"]').clear();
    await page.locator('[data-test-id="input-group-interval"]').fill('10m');
    await page.locator('[data-test-id="input-repeat-interval"]').clear();
    await page.locator('[data-test-id="input-repeat-interval"]').fill('24h');

    await page.getByTestId('confirm-action').click();

    // Verify values updated
    await expect(page.getByTestId('group_by_value')).toContainText(', cluster');
    await expect(page.getByTestId('group_wait_value')).toContainText('60s');
    await expect(page.getByTestId('group_interval_value')).toContainText('10m');
    await expect(page.getByTestId('repeat_interval_value')).toContainText('24h');
  });

  test('displays the Alertmanager YAML page and saves Alertmanager YAML', async ({ page }) => {
    await alertmanager.navigateToYAMLPage();

    // Verify no success alert initially
    await expect(page.getByTestId('alert-success')).toBeHidden();

    // Click save
    await page.getByTestId('save-changes').click();

    // Verify success alert appears
    await expect(page.getByTestId('alert-success')).toBeVisible();
  });

  test('creates and deletes a receiver', async ({ page }) => {
    const receiverName = `WebhookReceiver-${Date.now()}`;
    const receiverType = 'webhook';
    const configName = `${receiverType}_configs`;
    const label = 'severity = warning';
    const webhookURL = 'http://mywebhookurl';

    await test.step('Create Webhook Receiver', async () => {
      await alertmanager.navigateToAlertmanager();
      await alertmanager.createReceiver(receiverName, configName);

      await alertmanager.showAdvancedConfiguration();
      await expect(page.getByTestId('send-resolved-alerts')).toBeChecked();

      await page.getByTestId('webhook-url').fill(webhookURL);
      await page.getByTestId('label-0').fill(label);

      await alertmanager.save();
    });

    await test.step('Verify receiver was created', async () => {
      await alertmanager.validateReceiverInList(receiverName);
    });

    await test.step('Delete receiver', async () => {
      const receiverRow = page.getByRole('row', { name: new RegExp(receiverName) });
      await receiverRow.getByRole('button', { name: 'Actions' }).click();
      await page.getByRole('menuitem', { name: 'Delete Receiver' }).click();

      // Confirm deletion in modal
      const modal = page.getByRole('dialog', { name: /Delete Receiver/ });
      await expect(modal).toBeVisible();
      await modal.getByRole('button', { name: 'Delete Receiver' }).click();

      // Verify receiver was deleted
      await expect(receiverRow).toBeHidden();
    });
  });

  test('prevents deletion and form edit of a receiver with sub-route', async ({ page }) => {
    const yaml = `route:
  routes:
    - match:
      service: database
      receiver: team-DB-pager
      routes:
        - match:
          owner: team-X
          receiver: team-X-pager
receivers:
- name: 'team-X-pager'
- name: 'team-DB-pager'`;

    await test.step('Set YAML with sub-route', async () => {
      await alertmanager.navigateToYAMLPage();
      await alertmanager.setYAMLContent(yaml);
      await page.getByTestId('save-changes').click();
      await expect(page.getByTestId('alert-success')).toBeVisible();
    });

    await test.step('Verify Delete Receiver is disabled for receiver with sub-route', async () => {
      await page.getByRole('tab', { name: 'Details' }).click();

      const receiverRow = page.getByTestId('data-view-cell-team-X-pager-name').locator('..');
      await receiverRow.getByTestId('kebab-button').click();

      const deleteMenuItem = page.getByRole('menuitem', { name: 'Delete Receiver' });
      await expect(deleteMenuItem).toBeDisabled();
    });
  });

  test('converts existing match and match_re routing labels to matchers', async ({ page }) => {
    const receiverName = `EmailReceiver-${Date.now()}`;
    const severity = 'severity';
    const warning = 'warning';
    const service = 'service';
    const regex = '^(foo1|foo2|baz)$';
    const matcher1 = `${severity} = ${warning}`;
    const matcher2 = `${service} =~ ${regex}`;

    const yaml = `global:
  resolve_timeout: 5m
inhibit_rules:
  - equal:
      - namespace
      - alertname
    source_matchers:
      - severity = critical
    target_matchers:
      - severity =~ warning|info
  - equal:
      - namespace
      - alertname
    source_matchers:
      - severity = warning
    target_matchers:
      - severity = info
  - equal:
      - namespace
    source_matchers:
      - alertname = InfoInhibitor
    target_matchers:
      - severity = info
receivers:
  - name: Default
  - name: Watchdog
  - name: Critical
  - name: "null"
  - name: ${receiverName}
    email_configs:
      - to: you@there.com
        from: me@here.com
        smarthost: "smarthost:8080"
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
        - alertname = InfoInhibitor
      receiver: "null"
    - matchers:
        - severity = critical
      receiver: Critical
    - receiver: ${receiverName}
      match:
        ${severity}: ${warning}
      match_re:
        ${service}: ${regex}`;

    await test.step('Add receiver with match and match_re routing labels', async () => {
      await alertmanager.navigateToYAMLPage();
      await alertmanager.setYAMLContent(yaml);
      await page.getByTestId('save-changes').click();
      await expect(page.locator('.yaml-editor__buttons .pf-m-success')).toBeVisible();
    });

    await test.step('Verify receiver appears and edit it', async () => {
      await page.getByRole('tab', { name: 'Details' }).click();
      await expect(page.getByTestId(`data-view-cell-${receiverName}-name`)).toBeVisible();

      await alertmanager.navigateToEditReceiver(receiverName);

      // Verify matchers were converted from match/match_re
      await expect(page.getByTestId('label-0')).toHaveValue(matcher1);
      await expect(page.getByTestId('label-1')).toHaveValue(matcher2);

      await alertmanager.save();
    });

    await test.step('Verify match and match_re were converted to matchers in YAML', async () => {
      await alertmanager.navigateToYAMLPage();
      const yamlContent = await alertmanager.getYAMLContent();

      const config: AlertmanagerConfig = jsYaml.load(yamlContent) as AlertmanagerConfig;
      const route: AlertmanagerRoute | undefined = config.route.routes?.find(
        (r: AlertmanagerRoute) => r.receiver === receiverName,
      );

      expect(route?.matchers?.[0]).toBe(matcher1);
      expect(route?.matchers?.[1]).toBe(matcher2);
    });
  });
});
