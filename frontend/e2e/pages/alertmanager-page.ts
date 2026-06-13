import { expect } from '@playwright/test';
import yaml from 'js-yaml';

import BasePage from './base-page';

type AlertmanagerConfig = {
  global?: Record<string, any>;
  receivers?: AlertmanagerReceiver[];
  route?: any;
  inhibit_rules?: any[];
};

type AlertmanagerReceiver = {
  name: string;
  [key: string]: any;
};

export class AlertmanagerPage extends BasePage {
  private readonly createReceiverButton = this.page.getByTestId('create-receiver');
  private readonly receiverNameInput = this.page.getByTestId('receiver-name');
  private readonly receiverTypeDropdown = this.page.getByTestId('receiver-type');
  private readonly saveChangesButton = this.page.getByTestId('save-changes');
  private readonly advancedConfigButton = this.page.getByTestId('advanced-configuration');

  async navigateToAlertmanager(): Promise<void> {
    await this.goTo('/settings/cluster/alertmanagerconfig');
    await expect(this.createReceiverButton).toBeVisible();
  }

  async navigateToYAMLPage(): Promise<void> {
    await this.goTo('/settings/cluster/alertmanageryaml');
    await expect(this.page.getByRole('button', { name: 'Copy code to clipboard' })).toBeVisible();
  }

  async navigateToEditReceiver(receiverName: string): Promise<void> {
    await this.goTo(`/settings/cluster/alertmanagerconfig/receivers/${receiverName}/edit`);
    await expect(this.saveChangesButton).toBeVisible();
  }

  async createReceiver(receiverName: string, receiverTypeConfig: string): Promise<void> {
    await this.robustClick(this.createReceiverButton);
    await this.receiverNameInput.fill(receiverName);

    // Open receiver type dropdown and select
    await this.robustClick(this.receiverTypeDropdown);
    const typeOption = this.page.getByTestId(`receiver-type-${receiverTypeConfig}`);
    await this.robustClick(typeOption);
  }

  async save(): Promise<void> {
    await expect(this.saveChangesButton).toBeEnabled();
    await this.robustClick(this.saveChangesButton);
    await expect(this.createReceiverButton).toBeVisible({ timeout: 60_000 });
  }

  async showAdvancedConfiguration(): Promise<void> {
    const sendResolved = this.page.getByTestId('send-resolved-alerts');
    if (await sendResolved.isVisible()) return;

    const button = this.advancedConfigButton.locator('button');
    await this.robustClick(button);
    await expect(sendResolved).toBeVisible({ timeout: 15_000 });
  }

  async getYAMLContent(): Promise<string> {
    // Get content from Monaco editor
    const content = await this.page.evaluate(() => {
      const monacoEditor = (window as any).monaco?.editor?.getModels()?.[0];
      return monacoEditor?.getValue() || '';
    });

    return content;
  }

  async setYAMLContent(content: string): Promise<void> {
    await this.page.evaluate((text) => {
      const monacoEditor = (window as any).monaco?.editor?.getModels()?.[0];
      monacoEditor?.setValue(text);
    }, content);
  }

  async validateReceiverInList(receiverName: string): Promise<void> {
    // Navigate to list page and wait for the receiver to appear.
    // The alertmanager config propagation can take a few seconds after the secret
    // is patched, so retry navigation until the receiver row is visible.
    await expect(async () => {
      await this.navigateToAlertmanager();
      await expect(this.page.getByRole('row', { name: new RegExp(receiverName) })).toBeVisible({
        timeout: 5_000,
      });
    }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });

    // Check that integration type cell is visible
    const integrationTypeCell = this.page.getByTestId(
      `data-view-cell-${receiverName}-integration-types`,
    );
    await expect(integrationTypeCell).toBeVisible();

    // Check that routing labels cell is visible
    const routingLabelsCell = this.page.getByTestId(
      `data-view-cell-${receiverName}-routing-labels`,
    );
    await expect(routingLabelsCell).toBeVisible();
  }
}

export function getGlobalsAndReceiverConfig(
  receiverName: string,
  configName: string,
  yamlContent: string,
): {
  globals: any;
  receiverConfig: any;
} {
  const parsed = yaml.load(yamlContent);
  const config: AlertmanagerConfig =
    typeof parsed === 'object' && parsed !== null ? (parsed as AlertmanagerConfig) : ({} as AlertmanagerConfig);
  const receiver: AlertmanagerReceiver | undefined = config.receivers?.find(
    (r) => r.name === receiverName,
  );

  return {
    globals: config.global || {},
    receiverConfig: receiver?.[configName]?.[0] || {},
  };
}
