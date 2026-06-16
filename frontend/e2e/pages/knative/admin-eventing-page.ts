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
}
