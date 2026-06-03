import { expect, type Locator, type Page } from '@playwright/test';
import BasePage from './base-page';

export class HelmReleasesPage extends BasePage {
  private readonly emptyStateMessage: Locator;
  private readonly catalogLink: Locator;
  private readonly helmTable: Locator;
  private readonly filterToolbar: Locator;
  private readonly filterDropdown: Locator;
  private readonly deployedCheckbox: Locator;
  private readonly nameFilterInput: Locator;
  private readonly statusIcon: Locator;
  private readonly statusText: Locator;
  private readonly firstKebabButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emptyStateMessage = this.page.getByRole('heading', {
      name: 'No Helm Releases found',
      level: 3,
    });
    this.catalogLink = this.page.getByRole('link', {
      name: /Browse the catalog to discover available Helm Charts/i,
    });
    this.helmTable = this.page.locator('table').filter({ hasText: /Name.*Status/ });
    this.filterToolbar = this.page.locator('[data-ouia-component-id="DataViewFilters"]');
    this.filterDropdown = this.filterToolbar.locator('.pf-v6-c-menu-toggle').first();
    this.deployedCheckbox = this.page.locator(
      '[data-ouia-component-id="DataViewCheckboxFilter-filter-item-deployed"] input',
    );
    this.nameFilterInput = this.page.locator('[aria-label="Filter by name"]');
    this.statusIcon = this.page.getByTestId('success-icon');
    this.statusText = this.page.getByTestId('status-text');
    this.firstKebabButton = this.page.locator('[data-test-id="kebab-button"]').first();
  }

  async navigateToHelmTab(namespace?: string): Promise<void> {
    if (namespace) {
      // Navigate directly to namespace-specific Helm page
      await this.goTo(`/helm/ns/${namespace}`);
      await this.waitForLoadingComplete();
    } else {
      // First go to console home
      await this.goTo('/');
      await this.waitForLoadingComplete();

      // Navigate via sidebar: Ecosystem > Helm
      const ecosystemMenu = this.page.getByRole('button', { name: /Ecosystem/ });
      await this.robustClick(ecosystemMenu);

      const helmLink = this.page.getByRole('link', { name: /^Helm$/ });
      await this.robustClick(helmLink);
      await this.waitForLoadingComplete();
    }
  }

  async clickHelmReleasesTab(): Promise<void> {
    const helmReleasesTab = this.page.locator(
      '[data-test-id="horizontal-link-Helm Releases"]',
    );
    await this.robustClick(helmReleasesTab, { force: true });
  }

  async verifyEmptyState(): Promise<void> {
    await expect(this.emptyStateMessage).toContainText('No Helm Releases found');
    await expect(this.catalogLink).toBeVisible();
  }

  async searchByName(name: string): Promise<void> {
    // Open filter dropdown and select Name filter
    await this.robustClick(this.filterDropdown);
    const nameFilterOption = this.page
      .locator('.pf-v6-c-menu__list-item')
      .filter({ hasText: 'Name' });
    await this.robustClick(nameFilterOption);

    // Enter search term
    await this.nameFilterInput.clear();
    await this.nameFilterInput.fill(name);
  }

  async verifyHelmReleasesDisplayed(): Promise<void> {
    await expect(this.helmTable).toBeVisible();
  }

  async clickHelmReleaseName(name: string): Promise<void> {
    // Scope to the visible table to avoid strict mode violations when multiple namespaces have releases with the same name
    const releaseLink = this.helmTable.getByRole('link', { name, exact: true }).first();
    await this.robustClick(releaseLink);
  }

  async selectDeployedFilter(): Promise<void> {
    // Open status filter dropdown
    await this.robustClick(this.filterDropdown);
    const statusFilterOption = this.page
      .locator('.pf-v6-c-menu__list-item')
      .filter({ hasText: 'Status' });
    await this.robustClick(statusFilterOption);

    await this.robustClick(this.page.locator('[data-ouia-component-id="DataViewCheckboxFilter"]'));

    // Check Deployed checkbox
    await this.deployedCheckbox.check();
    await expect(this.deployedCheckbox).toBeChecked();

    // Verify URL contains filter
    await expect(this.page).toHaveURL(/status=deployed/);
  }

  async verifyDeployedFilterChecked(): Promise<void> {
    await expect(this.deployedCheckbox).toBeChecked();
  }

  async verifyHelmChartsListed(): Promise<void> {
    await expect(this.helmTable).toBeVisible();
    const rowCount = await this.helmTable.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  }

  async verifyHelmChartStatus(): Promise<void> {
    await expect(this.statusIcon).toBeVisible();
    await expect(this.statusText).toBeAttached();
  }

  async verifyStatusInHelmReleasesTable(helmReleaseName: string): Promise<void> {
    await expect(this.helmTable).toBeAttached();
    const row = this.helmTable
      .locator('tr')
      .filter({ hasText: helmReleaseName })
      .first();
    const statusButton = row.locator('td:nth-child(4) button');
    await this.robustClick(statusButton);
  }

  async openKebabMenu(): Promise<void> {
    await expect(this.helmTable).toBeAttached();
    await this.robustClick(this.firstKebabButton);
  }

  async selectKebabAction(action: 'Upgrade' | 'Rollback' | 'Delete Helm Release'): Promise<void> {
    const actionLocatorMap = {
      Upgrade: '[data-test-action="Upgrade"]',
      Rollback: '[data-test-action="Rollback"]',
      'Delete Helm Release': '[data-test-action="Delete Helm Release"]',
    };
    const actionLocator = this.page.locator(actionLocatorMap[action]);
    await this.robustClick(actionLocator);
  }

  async verifyFilterDropdownItems(
    item1: string,
    item2: string,
    item3: string,
  ): Promise<void> {
    await this.robustClick(this.filterDropdown);
    await this.robustClick(this.page.locator('.pf-v6-c-menu__list-item').filter({ hasText: 'Status' }));
    await this.robustClick(this.page.locator('[data-ouia-component-id="DataViewCheckboxFilter"]'));
    const pendingInstall = this.page.locator(
      '[data-ouia-component-id="DataViewCheckboxFilter-filter-item-pending-install"]',
    );
    const pendingUpgrade = this.page.locator(
      '[data-ouia-component-id="DataViewCheckboxFilter-filter-item-pending-upgrade"]',
    );
    const pendingRollback = this.page.locator(
      '[data-ouia-component-id="DataViewCheckboxFilter-filter-item-pending-rollback"]',
    );

    await expect(pendingInstall).toContainText(item1);
    await expect(pendingUpgrade).toContainText(item2);
    await expect(pendingRollback).toContainText(item3);
  }
}
