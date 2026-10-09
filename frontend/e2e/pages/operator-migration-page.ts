import type { Locator, Page } from '@playwright/test';

import BasePage from './base-page';
import { InstalledOperatorsPage } from './installed-operators-page';

export class OperatorMigrationPage extends BasePage {
  private readonly operators = new InstalledOperatorsPage(this.page);
  private readonly dialog = this.page.getByTestId('operator-migration-modal');
  private readonly review = this.page.getByTestId('review-operator-migration');
  private readonly start = this.page.getByTestId('confirm-operator-migration');
  private readonly removeBlocked = this.page.getByTestId('remove-blocked-operators');
  private readonly bulkActions = this.page.getByTestId('data-view-bulk-actions-menu-button');
  private readonly columnManagement = this.page.getByRole('button', {
    name: 'Column management',
    exact: true,
  });
  private readonly columnDialog = this.page.getByRole('dialog', {
    name: 'Manage columns',
    exact: true,
  });
  private readonly migrationColumn = this.columnDialog.getByRole('checkbox', {
    name: 'Migration status',
    exact: true,
  });
  private readonly migrationHeader = this.page.getByRole('columnheader', {
    name: /^Migration status/,
  });
  private restoreHiddenColumn = false;

  constructor(
    page: Page,
    private readonly onJobCreated?: (id: string) => void,
  ) {
    super(page);
  }

  async navigateToOperators(): Promise<void> {
    await this.goTo('/installed-software/all-namespaces/olmv0-operators?page=1&perPage=50');
    await this.operators.filterByName('console-migration-');
    if (!(await this.migrationHeader.isVisible())) {
      await this.robustClick(this.columnManagement);
      if (!(await this.migrationColumn.isChecked())) {
        this.restoreHiddenColumn = true;
        await this.migrationColumn.check();
      }
      await this.robustClick(this.columnDialog.getByRole('button', { name: 'Save', exact: true }));
    }
  }

  async restoreColumnVisibility(): Promise<void> {
    if (!this.restoreHiddenColumn) {
      return;
    }
    await this.goTo('/installed-software/all-namespaces/olmv0-operators?page=1&perPage=50');
    await this.robustClick(this.columnManagement);
    await this.migrationColumn.uncheck();
    await this.robustClick(this.columnDialog.getByRole('button', { name: 'Save', exact: true }));
  }

  getOperatorRow(packageName: string): Locator {
    return this.operators.getOperatorRow(packageName);
  }

  getStatus(packageName: string): Locator {
    return this.getOperatorRow(packageName).getByTestId('operator-migration-status');
  }

  getDialog(): Locator {
    return this.dialog;
  }

  getReviewButton(): Locator {
    return this.review;
  }

  getStartButton(): Locator {
    return this.start;
  }

  getPlans(): Locator {
    return this.dialog.getByRole('table', { name: 'Operator migration plans' });
  }

  getResult(subscriptionName: string, outcome: 'success' | 'failure' = 'success'): Locator {
    return this.page
      .getByTestId(
        outcome === 'success'
          ? 'Operator migration completed alert'
          : 'Operator migration failed alert',
      )
      .filter({ hasText: subscriptionName });
  }

  getProgress(): Locator {
    return this.page
      .getByTestId('Operator migration in progress alert')
      .or(this.page.getByTestId('Operator migration completed alert'))
      .or(this.page.getByTestId('Operator migration completed with errors alert'))
      .filter({ has: this.page.getByRole('progressbar') });
  }

  async openStatus(packageName: string): Promise<void> {
    await this.robustClick(this.getStatus(packageName));
  }

  getStatusDetails(): Locator {
    return this.page.getByRole('dialog', {
      name: /^(Eligible|Not eligible|Already migrated|Conflict)$/,
    });
  }

  async closeStatusDetails(): Promise<void> {
    await this.robustClick(
      this.getStatusDetails().getByRole('button', { name: 'Close', exact: true }),
    );
  }

  async openSingleMigration(packageName: string): Promise<void> {
    await this.robustClick(
      this.getOperatorRow(packageName).getByRole('button', { name: 'Actions', exact: true }),
    );
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) =>
          r.request().method() === 'POST' &&
          new URL(r.url()).pathname.endsWith('/api/olm/migration/dry-run'),
        { timeout: 300_000 },
      ),
      this.robustClick(this.page.getByTestId('Migrate to Next-Gen Operators')),
    ]);
    if (!response.ok()) {
      throw new Error(`Migration plan request failed: ${await response.text()}`);
    }
    const result = await response.json();
    if (result.planningError) {
      throw new Error(`Migration plan could not be prepared: ${result.planningError}`);
    }
  }

  async openBulkMigration(packageNames: string[]): Promise<void> {
    for (const packageName of packageNames) {
      await this.getOperatorRow(packageName).getByRole('checkbox').check();
    }
    await this.robustClick(this.bulkActions);
    await this.robustClick(
      this.page.getByTestId(`Migrate to Next-Gen Operators (${packageNames.length})`),
    );
  }

  async removeBlockedOperators(): Promise<void> {
    await this.robustClick(this.removeBlocked);
  }

  async reviewMigration(): Promise<void> {
    await this.robustClick(this.review, { timeout: 300_000, retries: 1 });
  }

  async acknowledgeRecovery(): Promise<void> {
    for (const id of [
      'olm-migration-reviewed-plan',
      'olm-migration-acknowledged-recovery',
      'olm-migration-recovery-plan',
    ]) {
      await this.page.getByTestId(id).check();
    }
  }

  async startMigration(): Promise<void> {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) =>
          r.request().method() === 'POST' &&
          new URL(r.url()).pathname.endsWith('/api/olm/migration/bulk'),
        { timeout: 300_000 },
      ),
      this.robustClick(this.start),
    ]);
    if (response.status() === 202) {
      const { jobID } = await response.json();
      this.onJobCreated?.(jobID);
    }
  }

  async cancelMigration(): Promise<void> {
    await this.robustClick(this.dialog.getByRole('button', { name: 'Cancel', exact: true }));
  }

  async openPlan(packageName: string): Promise<void> {
    await this.robustClick(
      this.dialog.getByRole('button', { name: `Migration plan for ${packageName}`, exact: true }),
    );
  }

  async minimizeProgress(): Promise<void> {
    await this.robustClick(this.getProgress().getByTestId('toast-minimize-action'));
  }

  async navigateToExtensions(): Promise<void> {
    await this.goTo('/installed-software/all-namespaces');
  }

  getExtensionLink(name: string): Locator {
    return this.page
      .getByTestId(`data-view-cell-${name}-name`)
      .getByRole('link', { name, exact: true });
  }
}
