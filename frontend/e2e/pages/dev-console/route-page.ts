import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from '../base-page';

export class RoutePage extends BasePage {
  private readonly createButton = this.page.locator('[data-test="item-create"]');
  private readonly nameInput = this.page.locator('#name');
  private readonly hostnameInput = this.page.locator('#hostname');
  private readonly serviceDropdown = this.page.locator('#service');
  private readonly targetPortDropdown = this.page.locator('#target-port');
  private readonly submitButton = this.page.locator('[data-test-id="submit-button"]');
  private readonly breadcrumb = this.page.locator('[aria-label="Breadcrumb"]');

  constructor(page: Page) {
    super(page);
  }

  async clickCreateRoute(): Promise<void> {
    await this.robustClick(this.createButton);
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async fillHostname(hostname: string): Promise<void> {
    await this.hostnameInput.scrollIntoViewIfNeeded();
    await this.hostnameInput.fill(hostname);
  }

  async selectService(serviceName: string): Promise<void> {
    await this.serviceDropdown.scrollIntoViewIfNeeded();
    await this.robustClick(this.serviceDropdown);
    await this.robustClick(this.page.locator(`[data-test-dropdown-menu="${serviceName}"]`));
  }

  async selectTargetPort(targetPort: string): Promise<void> {
    await this.targetPortDropdown.scrollIntoViewIfNeeded();
    await this.robustClick(this.targetPortDropdown);
    const port = targetPort.substring(0, 4);
    await this.robustClick(this.page.locator(`[data-test-dropdown-menu="${port}-tcp"]`));
  }

  async submitForm(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  async createRoute(
    name: string,
    service: string,
    targetPort: string,
    hostname?: string,
  ): Promise<void> {
    await this.clickCreateRoute();
    await this.fillName(name);
    if (hostname) {
      await this.fillHostname(hostname);
    }
    await this.selectService(service);
    await this.selectTargetPort(targetPort);
    await this.submitForm();
    await expect(this.breadcrumb).toContainText('Routes');
  }

  async expectBreadcrumbToContainRoutes(): Promise<void> {
    await expect(this.breadcrumb).toContainText('Routes');
  }
}
