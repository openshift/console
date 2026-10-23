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
  private readonly selectPage = this.page.getByTestId('select-all-header').getByRole('checkbox');
  private readonly selectAllMatching = this.page.getByRole('button', {
    name: /^Select all \d+ .+\.$/,
  });
  private readonly visibleOperators = this.page
    .getByTestId('data-view-table')
    .getByRole('row')
    .filter({
      has: this.page.getByTestId(/^operator-row-console-migration-/),
    });
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

  /** Binds migration UI locators and an optional callback for tracking accepted durable jobs. */
  constructor(
    page: Page,
    private readonly onJobCreated?: (id: string) => void,
  ) {
    super(page);
  }

  /** Opens Classic Operators, filters fixture packages, and makes the migration-status column visible. */
  async navigateToOperators(perPage = 50): Promise<void> {
    await this.goTo(`/installed-software/all-namespaces/olmv0-operators?page=1&perPage=${perPage}`);
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

  /** Restores the user's previously hidden migration-status column after fixture interactions. */
  async restoreColumnVisibility(): Promise<void> {
    if (!this.restoreHiddenColumn) {
      return;
    }
    await this.goTo('/installed-software/all-namespaces/olmv0-operators?page=1&perPage=50');
    await this.robustClick(this.columnManagement);
    await this.migrationColumn.uncheck();
    await this.robustClick(this.columnDialog.getByRole('button', { name: 'Save', exact: true }));
  }

  /** Locates a fixture package row in the Installed Operators table. */
  getOperatorRow(packageName: string): Locator {
    return this.operators.getOperatorRow(packageName);
  }

  /** Selects fixture operator rows currently visible after filtering and pagination. */
  getVisibleOperators(): Locator {
    return this.visibleOperators;
  }

  /** Selects a package's migration eligibility indicator. */
  getStatus(packageName: string): Locator {
    return this.getOperatorRow(packageName).getByTestId('operator-migration-status');
  }

  /** Selects the active migration plan and confirmation dialog. */
  getDialog(): Locator {
    return this.dialog;
  }

  /** Selects the action that reviews the current migration plan. */
  getReviewButton(): Locator {
    return this.review;
  }

  /** Selects the dry-run plan acknowledgment on the Check migration step. */
  getPlanAcknowledgement(): Locator {
    return this.dialog.getByTestId('olm-migration-reviewed-plan');
  }

  /** Selects the migration submission action after plan acknowledgments. */
  getStartButton(): Locator {
    return this.start;
  }

  /** Selects the operator summary table used for dry-run review. */
  getPlans(): Locator {
    return this.dialog.getByRole('table', { name: 'Operator migration plans' });
  }

  /** Selects a per-operator migration outcome by Subscription name and success or failure. */
  getResult(subscriptionName: string, outcome: 'success' | 'failure' = 'success'): Locator {
    return this.page
      .getByTestId(
        outcome === 'success'
          ? 'Operator migration completed alert'
          : 'Operator migration failed alert',
      )
      .filter({ hasText: subscriptionName });
  }

  /** Selects the batch progress notification across active and terminal states. */
  getProgress(): Locator {
    return this.page
      .getByTestId('Operator migration in progress alert')
      .or(this.page.getByTestId('Operator migration completed alert'))
      .or(this.page.getByTestId('Operator migration completed with errors alert'))
      .filter({ has: this.page.getByRole('progressbar') });
  }

  /** Opens the package's eligibility details from its status indicator. */
  async openStatus(packageName: string): Promise<void> {
    // Horizontal scrolling can leave the indicator behind a sticky column.
    // Keyboard activation targets the indicator without clicking the overlaid name link.
    await this.getStatus(packageName).focus();
    await this.getStatus(packageName).press('Enter');
  }

  /** Selects the currently open eligibility details. */
  getStatusDetails(): Locator {
    return this.page.getByRole('dialog', {
      name: /^(Eligible|Not eligible|Already migrated|Conflict)$/,
    });
  }

  /** Dismisses eligibility details before another table interaction. */
  async closeStatusDetails(): Promise<void> {
    await this.robustClick(
      this.getStatusDetails().getByRole('button', { name: 'Close', exact: true }),
    );
  }

  /** Opens migration review through the selected operator's row action. */
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
      this.robustClick(this.page.getByTestId('Migrate to OLM v1 cluster extensions')),
    ]);
    if (!response.ok()) {
      throw new Error(`Migration plan request failed: ${await response.text()}`);
    }
    const result = await response.json();
    if (result.planningError) {
      throw new Error(`Migration plan could not be prepared: ${result.planningError}`);
    }
  }

  /** Selects fixture packages and opens the shared bulk migration review. */
  async openBulkMigration(packageNames: string[]): Promise<void> {
    for (const packageName of packageNames) {
      await this.getOperatorRow(packageName).getByRole('checkbox').check();
    }
    await this.openSelectedMigration(packageNames.length);
  }

  /** Selects the visible page and then extends the selection to every matching page. */
  async selectAllOperators(): Promise<void> {
    await this.selectPage.check();
    await this.robustClick(this.selectAllMatching);
  }

  /** Opens bulk review for the current selection and expected operator count. */
  async openSelectedMigration(count: number): Promise<void> {
    await this.robustClick(this.bulkActions);
    await this.robustClick(
      this.page.getByTestId(`Migrate to OLM v1 cluster extensions (${count})`),
    );
  }

  /** Removes blocked entries through the migration review action. */
  async removeBlockedOperators(): Promise<void> {
    await this.robustClick(this.removeBlocked);
  }

  /** Acknowledges the checked dry-run plan and advances, allowing time for real catalog checks. */
  async reviewMigration(): Promise<void> {
    await this.getPlanAcknowledgement().check({ timeout: 300_000 });
    await this.robustClick(this.review, { timeout: 300_000, retries: 1 });
  }

  /** Checks the recovery-risk and recovery-plan acknowledgments on the confirmation step. */
  async acknowledgeRecovery(): Promise<void> {
    for (const id of ['olm-migration-acknowledged-recovery', 'olm-migration-recovery-plan']) {
      await this.page.getByTestId(id).check();
    }
  }

  /** Submits through the UI, requires an accepted job ID, and registers it for cleanup. */
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
    if (response.status() !== 202) {
      throw new Error(
        `Migration submission failed (HTTP ${response.status()}): ${await response.text()}`,
      );
    }
    const { jobID } = await response.json();
    if (!jobID) throw new Error('Migration submission returned no job ID');
    this.onJobCreated?.(jobID);
  }

  /** Selects the explicit rollback confirmation dialog. */
  getRollbackDialog(): Locator {
    return this.page.getByTestId('operator-migration-rollback-modal');
  }

  /** Selects the per-operator recovery success or failure notification. */
  getRollbackResult(subscriptionName: string, outcome: 'success' | 'failure' = 'success'): Locator {
    return this.page
      .getByTestId(
        outcome === 'success'
          ? 'Operator rollback completed alert'
          : 'Operator rollback failed alert',
      )
      .filter({ hasText: subscriptionName });
  }

  /** Selects recovery progress across active and terminal notification states. */
  getRollbackProgress(): Locator {
    return this.page
      .getByTestId('Operator rollback in progress alert')
      .or(this.page.getByTestId('Operator rollback completed alert'))
      .or(this.page.getByTestId('Operator rollback failed alert'))
      .filter({ has: this.page.getByRole('progressbar') });
  }

  /** Opens initial or retry recovery from the corresponding failure notification. */
  async openRollback(subscriptionName: string, retry = false): Promise<void> {
    const result = retry
      ? this.getRollbackResult(subscriptionName, 'failure')
      : this.getResult(subscriptionName, 'failure');
    await this.robustClick(result.getByTestId('rollback-operator-migration'));
  }

  /** Closes rollback confirmation before queuing recovery. */
  async cancelRollback(): Promise<void> {
    await this.robustClick(
      this.getRollbackDialog().getByRole('button', { name: 'Cancel', exact: true }),
    );
  }

  /** Acknowledges target removal, submits through the UI, and tracks the accepted recovery job. */
  async startRollback(): Promise<void> {
    await this.getRollbackDialog().getByTestId('olm-migration-rollback-acknowledged').check();
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) =>
          r.request().method() === 'POST' &&
          new URL(r.url()).pathname.endsWith('/api/olm/migration/rollback'),
        { timeout: 300_000 },
      ),
      this.robustClick(this.getRollbackDialog().getByTestId('confirm-operator-migration-rollback')),
    ]);
    if (response.status() !== 202) {
      throw new Error(
        `Rollback submission failed (HTTP ${response.status()}): ${await response.text()}`,
      );
    }
    const { jobID } = await response.json();
    if (!jobID) throw new Error('Rollback submission returned no job ID');
    this.onJobCreated?.(jobID);
  }

  /** Closes migration review before changing source resources. */
  async cancelMigration(): Promise<void> {
    await this.robustClick(this.dialog.getByRole('button', { name: 'Cancel', exact: true }));
  }

  /** Expands the selected operator's resource-level migration plan. */
  async openPlan(packageName: string): Promise<void> {
    await this.robustClick(
      this.dialog.getByRole('button', { name: `Migration plan for ${packageName}`, exact: true }),
    );
  }

  /** Minimizes the persistent batch notification through its toast action. */
  async minimizeProgress(): Promise<void> {
    await this.robustClick(this.getProgress().getByTestId('toast-minimize-action'));
  }

  /** Opens the cluster-extension list used after successful migration. */
  async navigateToExtensions(): Promise<void> {
    await this.goTo('/installed-software/all-namespaces');
  }

  /** Locates the installed target extension's details link. */
  getExtensionLink(name: string): Locator {
    return this.page
      .getByTestId(`data-view-cell-${name}-name`)
      .getByRole('link', { name, exact: true });
  }
}
