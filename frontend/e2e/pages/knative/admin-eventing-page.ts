import type { Locator } from '@playwright/test';

import BasePage from '../base-page';

export class AdminEventingPage extends BasePage {
  private readonly createButton = this.page.getByTestId('tab-list-page-create');
  private readonly emptyMessage = this.page.getByTestId('empty-box-body');

  private readonly eventSourcesTab = this.page.getByTestId('horizontal-link-Event Sources');
  private readonly brokersTab = this.page.getByTestId('horizontal-link-Brokers');
  private readonly triggersTab = this.page.getByTestId('horizontal-link-Triggers');
  private readonly channelsTab = this.page.getByTestId('horizontal-link-Channels');
  private readonly subscriptionsTab = this.page.getByTestId('horizontal-link-Subscriptions');

  async navigateToEventing(namespace: string): Promise<void> {
    await this.goTo(`/eventing/ns/${namespace}`);
  }

  getCreateButton(): Locator {
    return this.createButton;
  }

  getEmptyMessage(): Locator {
    return this.emptyMessage;
  }

  async clickTab(
    tab: 'Event Sources' | 'Brokers' | 'Triggers' | 'Channels' | 'Subscriptions',
  ): Promise<void> {
    const tabMap = {
      'Event Sources': this.eventSourcesTab,
      Brokers: this.brokersTab,
      Triggers: this.triggersTab,
      Channels: this.channelsTab,
      Subscriptions: this.subscriptionsTab,
    };
    await this.robustClick(tabMap[tab]);
    await this.waitForLoadingComplete();
  }

  async selectCreateOption(option: string): Promise<void> {
    await this.robustClick(this.createButton);
    const menuItem = this.page.locator(
      `[data-test="${option}"], [data-test-dropdown-menu="${option}"]`,
    );
    await this.robustClick(menuItem.first());
  }

  async fillPingSourceForm(data: string, schedule: string, sinkUri: string): Promise<void> {
    await this.page.locator('#form-input-formData-data-PingSource-data-field').fill(data);
    await this.page.locator('#form-input-formData-data-PingSource-schedule-field').fill(schedule);
    await this.page.getByRole('radio', { name: 'URI' }).click();
    await this.page.locator('#form-input-formData-sink-uri-field').fill(sinkUri);
  }

  async createChannel(type: string): Promise<void> {
    const typeDropdown = this.page.locator('#form-dropdown-formData-type-field');
    await typeDropdown.click();
    await this.page.getByTestId('console-select-item').filter({ hasText: type }).click();
    await this.robustClick(this.page.getByTestId('save-changes'));
  }

  async createBroker(name: string): Promise<void> {
    await this.page.locator('#form-radiobutton-editorType-form-field').click();
    const nameField = this.page.locator(
      '[data-test="application-form-app-name"], [data-test-id="application-form-app-name"]',
    ).first();
    await nameField.clear();
    await nameField.fill(name);
    await this.robustClick(this.page.getByTestId('save-changes'));
  }
}
