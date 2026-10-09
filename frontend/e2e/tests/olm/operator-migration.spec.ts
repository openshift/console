/* eslint playwright/expect-expect: ["warn", { "assertFunctionNames": ["expect", "checkIneligibleOperator", "checkInterruption", "checkRollbackInterruption"] }] */
import type { Browser, Page } from '@playwright/test';
import type {
  MigrationOperator,
  OperatorMigrationFixture,
} from '../../fixtures/operator-migration-fixture';
import { expect } from '../../fixtures';
import { test, PACKAGES, OLM_GROUP, TARGET_GROUP } from '../../fixtures/operator-migration-fixture';
import { OLM_CLUSTER_STATE_LOCK } from '../../utils/locks';
import { OperatorMigrationPage } from '../../pages/operator-migration-page';
import { MastheadPage } from '../../pages/masthead-page';
import { loginFromEnv } from '../../setup/login-helper';

// TP-OCPSTRAT-2692-OLMv0-OLMv1-MIGRATION-TP-v1.2:
// https://github.com/miyadav/test-plans/pull/1
// Real catalogs and cluster outcomes; no migration API response interception.
/** Drives a real late failure through the UI while leaving an installed target for explicit recovery. */
const prepareInstalledTargetFailure = async (
  migration: OperatorMigrationFixture,
  migrationPage: OperatorMigrationPage,
  successful?: MigrationOperator,
) => {
  const operator = await migration.install(PACKAGES.first);
  const originalSubscription = await migration.getSubscription(operator);
  const removeFailure = await migration.denyInstalledMigration(operator);
  try {
    await migrationPage.navigateToOperators();
    if (successful)
      await migrationPage.openBulkMigration([operator.packageName, successful.packageName]);
    else await migrationPage.openSingleMigration(operator.packageName);
    await migrationPage.reviewMigration();
    await migrationPage.acknowledgeRecovery();
    await migration.withOperandContinuity(
      successful ? [operator, successful] : [operator],
      async () => {
        await migrationPage.startMigration();
        await expect(migrationPage.getResult(operator.subscriptionName, 'failure')).toContainText(
          'Console migration fixture: installed target failure',
          { timeout: 300_000 },
        );
        await expect(migrationPage.getResult(operator.subscriptionName, 'failure')).toContainText(
          'requires explicit recovery',
        );
      },
    );
    const extension = await migration.getExtension(operator);
    expect(extension.status?.conditions?.find(({ type }) => type === 'Installed')?.status).toBe(
      'True',
    );
    await migration.expectAbsent(
      OLM_GROUP,
      'v1alpha1',
      'subscriptions',
      operator.subscriptionName,
      operator.namespace,
    );
    await migration.expectPreservedMigration(operator);
    if (successful) {
      await expect(migrationPage.getResult(successful.subscriptionName)).toContainText(
        'migrated to OLM v1 cluster extensions successfully',
        { timeout: 300_000 },
      );
      await migration.expectMigrated(successful);
    }
    return { operator, originalSubscription, extension };
  } finally {
    await removeFailure();
  }
};

test.describe('Operator migration', { lock: OLM_CLUSTER_STATE_LOCK }, () => {
  test.setTimeout(900_000);

  test('migrates one operator after a read-only plan review and keeps its operand running', async ({
    migration,
    migrationPage,
  }) => {
    // F-1, F-3 (same namespace), F-11, F-12 (no repeat migration).
    const operator = await migration.install(PACKAGES.first);
    const beforeDryRun = await migration.getSubscription(operator);

    await test.step('Inspect eligibility and cancel a dry run without changing the source', async () => {
      await migrationPage.navigateToOperators();
      await expect(migrationPage.getStatus(operator.packageName)).toHaveText('Eligible', {
        timeout: 120_000,
      });
      await migrationPage.openSingleMigration(operator.packageName);
      await expect(migrationPage.getPlans()).toContainText('Passed', { timeout: 120_000 });
      await migrationPage.openPlan(operator.packageName);
      await expect(
        migrationPage
          .getDialog()
          .getByRole('table', { name: `Resources to migrate for ${operator.packageName}` }),
      ).toContainText('Deployment');
      await expect(migrationPage.getDialog()).toContainText(operator.subscriptionName);
      await expect(migrationPage.getDialog()).toContainText(operator.namespace);
      await migrationPage.cancelMigration();
      const afterDryRun = await migration.getSubscription(operator);
      expect(afterDryRun.metadata.uid).toBe(beforeDryRun.metadata.uid);
      expect(afterDryRun.spec).toEqual(beforeDryRun.spec);
      expect(afterDryRun.status.installedCSV).toBe(operator.csvName);
      await migration.expectAbsent(
        TARGET_GROUP,
        'v1',
        'clusterobjectsets',
        `${operator.subscriptionName}-1`,
      );
      await migration.expectAbsent(
        TARGET_GROUP,
        'v1',
        'clusterextensions',
        operator.subscriptionName,
      );
    });

    await test.step('Require review acknowledgments and start the migration', async () => {
      await migrationPage.openSingleMigration(operator.packageName);
      await expect(migrationPage.getPlanAcknowledgement()).toBeVisible();
      await expect(migrationPage.getPlanAcknowledgement()).not.toBeChecked();
      await expect(migrationPage.getReviewButton()).toBeDisabled();
      await migrationPage.reviewMigration();
      await expect(migrationPage.getPlanAcknowledgement()).toBeHidden();
      await expect(migrationPage.getStartButton()).toBeDisabled();
      await migrationPage.acknowledgeRecovery();
      await expect(migrationPage.getStartButton()).toBeEnabled();
      await migration.withOperandContinuity([operator], () =>
        migration.withHandoverObservations(operator, async () => {
          await migrationPage.startMigration();
          await expect(migrationPage.getDialog()).toBeHidden();
          await expect(migrationPage.getProgress()).toBeVisible();
          await expect(migrationPage.getResult(operator.subscriptionName)).toContainText(
            'migrated to OLM v1 cluster extensions successfully',
            { timeout: 300_000 },
          );
          await migration.expectMigrated(operator);
        }),
      );
      await expect(migrationPage.getProgress()).toContainText('1 of 1 Operators processed');
      await migrationPage.minimizeProgress();
      await expect(migrationPage.getProgress()).toBeHidden();
    });

    await test.step('Revisit Installed Software and verify the operator moved to OLMv1', async () => {
      await migrationPage.navigateToOperators();
      await expect(migrationPage.getOperatorRow(operator.packageName)).not.toBeAttached();
      await migrationPage.navigateToExtensions();
      await expect(migrationPage.getExtensionLink(operator.subscriptionName)).toBeVisible({
        timeout: 60_000,
      });
    });
  });

  test('keeps operands in another namespace running and reconciles new workloads after migration', async ({
    migration,
    migrationPage,
  }) => {
    // F-3: operator installation stays in place while it manages operands in another namespace.
    const operator = await migration.install(PACKAGES.first);
    const operandNamespace = await migration.createOperandNamespace();
    expect(operandNamespace).not.toBe(operator.namespace);
    await migration.createOperand(operator, 'before-migration', operandNamespace);
    await migrationPage.navigateToOperators();
    await migrationPage.openSingleMigration(operator.packageName);
    await migrationPage.reviewMigration();
    await migrationPage.acknowledgeRecovery();
    await migration.withOperandContinuity([operator, { namespace: operandNamespace }], () =>
      migration.withReconciliationObservations(operator, operandNamespace, async () => {
        await migrationPage.startMigration();
        await expect(migrationPage.getResult(operator.subscriptionName)).toContainText(
          'migrated to OLM v1 cluster extensions successfully',
          { timeout: 300_000 },
        );
        await migration.expectMigrated(operator);
        await migration.createOperand(operator, 'after-migration', operandNamespace);
      }),
    );
    expect((await migration.getExtension(operator)).spec.namespace).toBe(operator.namespace);
  });

  test('selects operators across pages, removes a blocked operator, and migrates every eligible selection', async ({
    migration,
    migrationPage,
  }) => {
    // F-2, F-3 (same namespace), F-7, F-8.
    const first = await migration.install(PACKAGES.first);
    const second = await migration.install(PACKAGES.second);
    const blocked = await migration.install(PACKAGES.ownNamespace);
    await migrationPage.navigateToOperators();
    await expect(migrationPage.getStatus(blocked.packageName)).toHaveText('Not eligible', {
      timeout: 120_000,
    });
    // Exercise select-all matching, rather than stopping at the visible page.
    await migrationPage.navigateToOperators(1);
    await expect(migrationPage.getVisibleOperators()).toHaveCount(1);
    await migrationPage.selectAllOperators();
    await migrationPage.openSelectedMigration(3);
    await expect(migrationPage.getPlans()).toContainText('Blocked', { timeout: 120_000 });
    await expect(migrationPage.getReviewButton()).toBeDisabled();
    await migrationPage.removeBlockedOperators();
    await expect(migrationPage.getPlans()).not.toContainText(blocked.packageName);
    await migrationPage.reviewMigration();
    await migrationPage.acknowledgeRecovery();
    await expect(migrationPage.getStartButton()).toHaveText('Start migration (2)');
    await migration.withOperandContinuity([first, second, blocked], async () => {
      await migrationPage.startMigration();
      for (const operator of [first, second]) {
        await expect(migrationPage.getResult(operator.subscriptionName)).toContainText(
          'migrated to OLM v1 cluster extensions successfully',
          { timeout: 300_000 },
        );
        await migration.expectMigrated(operator);
      }
    });
    await expect(migrationPage.getProgress()).toContainText('2 of 2 Operators processed');
    expect((await migration.getSubscription(blocked)).status.installedCSV).toBe(blocked.csvName);
    await migration.expectAbsent(TARGET_GROUP, 'v1', 'clusterextensions', blocked.subscriptionName);
  });

  test('migrates another operator without changing an operator already managed by OLMv1', async ({
    migration,
    migrationPage,
  }) => {
    // F-8, F-12: a migrated operator has no CSV row and is not offered for re-migration.
    const migrated = await migration.install(PACKAGES.first);
    await migrationPage.navigateToOperators();
    await migrationPage.openSingleMigration(migrated.packageName);
    await migrationPage.reviewMigration();
    await migrationPage.acknowledgeRecovery();
    await migration.withOperandContinuity([migrated], async () => {
      await migrationPage.startMigration();
      await expect(migrationPage.getResult(migrated.subscriptionName)).toContainText(
        'migrated to OLM v1 cluster extensions successfully',
        { timeout: 300_000 },
      );
      await migration.expectMigrated(migrated);
    });
    const originalExtension = await migration.getExtension(migrated);
    const eligible = await migration.install(PACKAGES.second);
    await migrationPage.navigateToOperators();
    await expect(migrationPage.getOperatorRow(migrated.packageName)).not.toBeAttached();
    await migrationPage.openBulkMigration([eligible.packageName]);
    await expect(migrationPage.getPlans()).not.toContainText(migrated.subscriptionName);
    await migrationPage.reviewMigration();
    await migrationPage.acknowledgeRecovery();
    await expect(migrationPage.getStartButton()).toHaveText('Start migration (1)');
    await migration.withOperandContinuity([migrated, eligible], async () => {
      await migrationPage.startMigration();
      await expect(migrationPage.getResult(eligible.subscriptionName)).toContainText(
        'migrated to OLM v1 cluster extensions successfully',
        { timeout: 300_000 },
      );
      await migration.expectMigrated(eligible);
    });
    const unchangedExtension = await migration.getExtension(migrated);
    expect(unchangedExtension.metadata.uid).toBe(originalExtension.metadata.uid);
    expect(unchangedExtension.spec).toEqual(originalExtension.spec);
    await migration.expectAbsent(
      OLM_GROUP,
      'v1alpha1',
      'subscriptions',
      migrated.subscriptionName,
      migrated.namespace,
    );
    await migrationPage.navigateToExtensions();
    await expect(migrationPage.getExtensionLink(migrated.subscriptionName)).toBeVisible();
    await expect(migrationPage.getExtensionLink(eligible.subscriptionName)).toBeVisible();
  });

  const checkIneligibleOperator = async (
    migration: OperatorMigrationFixture,
    migrationPage: OperatorMigrationPage,
    packageName: string,
    reason: string,
    prepare?: (operator: MigrationOperator) => Promise<void>,
  ) => {
    // F-7: independently constructed catalog fixtures, rather than scan-derived labels.
    const operator = await migration.install(packageName);
    await prepare?.(operator);
    await migrationPage.navigateToOperators();
    await expect(migrationPage.getStatus(packageName)).toHaveText('Not eligible', {
      timeout: 120_000,
    });
    await migrationPage.openStatus(packageName);
    await expect(migrationPage.getStatusDetails()).toContainText(reason);
    await migrationPage.closeStatusDetails();
    await migrationPage.openSingleMigration(packageName);
    await expect(migrationPage.getPlans()).toContainText('Blocked', { timeout: 120_000 });
    await expect(migrationPage.getDialog()).toContainText(reason);
    await expect(migrationPage.getReviewButton()).toBeDisabled();
    await migrationPage.cancelMigration();
    await migration.expectAbsent(
      TARGET_GROUP,
      'v1',
      'clusterextensions',
      operator.subscriptionName,
    );
    expect((await migration.getSubscription(operator)).status.installedCSV).toBe(operator.csvName);
  };

  test('shows why console-migration-own-namespace cannot migrate and blocks the review step', async ({
    migration,
    migrationPage,
  }) => {
    await checkIneligibleOperator(
      migration,
      migrationPage,
      PACKAGES.ownNamespace,
      'CSV does not declare AllNamespaces install mode as supported',
    );
  });

  test('shows why console-migration-no-target cannot migrate and blocks the review step', async ({
    migration,
    migrationPage,
  }) => {
    await checkIneligibleOperator(
      migration,
      migrationPage,
      PACKAGES.noTarget,
      'not found in any serving ClusterCatalog',
    );
  });

  test('shows the declared dependency blocker and prevents migration', async ({
    migration,
    migrationPage,
  }) => {
    await checkIneligibleOperator(
      migration,
      migrationPage,
      PACKAGES.first,
      'bundle declares olm.package.required dependency',
      (operator) => migration.declareMissingDependency(operator),
    );
  });

  test('shows the unhealthy CSV blocker after a controller image failure', async ({
    migration,
    migrationPage,
  }) => {
    await checkIneligibleOperator(
      migration,
      migrationPage,
      PACKAGES.first,
      'CSV health',
      (operator) => migration.makeCSVUnhealthy(operator),
    );
  });

  test('warns about dual management before migration and blocks a conflicted operator', async ({
    migration,
    migrationPage,
  }) => {
    // F-7, F-10: both resources are explicitly present before scanning.
    const operator = await migration.install(PACKAGES.first);
    await migration.createConflict(operator);
    await migrationPage.navigateToOperators();
    await expect(migrationPage.getStatus(operator.packageName)).toHaveText('Conflict', {
      timeout: 120_000,
    });
    await migrationPage.openSingleMigration(operator.packageName);
    await expect(migrationPage.getPlans()).toContainText('Blocked', { timeout: 120_000 });
    await expect(migrationPage.getDialog()).toContainText(
      'both Subscription and annotated ClusterExtension',
    );
    await expect(migrationPage.getReviewButton()).toBeDisabled();
    await migrationPage.cancelMigration();
    expect((await migration.getSubscription(operator)).status.installedCSV).toBe(operator.csvName);
  });

  test('reports automatic recovery with the failure reason and allows a standalone retry', async ({
    migration,
    migrationPage,
  }) => {
    // F-4 (automatic recovery), F-5.
    const operator = await migration.install(PACKAGES.first);
    await migrationPage.navigateToOperators();
    await migrationPage.openSingleMigration(operator.packageName);
    await migrationPage.reviewMigration();
    await migrationPage.acknowledgeRecovery();
    const removeFailure = await migration.denyMigration(operator, 'recover');
    await migration.withOperandContinuity([operator], async () => {
      await migrationPage.startMigration();
      await expect(migrationPage.getResult(operator.subscriptionName, 'failure')).toContainText(
        'console automatically restored OLM (Classic) Operator management',
        { timeout: 300_000 },
      );
      await expect(migrationPage.getResult(operator.subscriptionName, 'failure')).toContainText(
        'Console migration fixture: recover failure',
      );
      await migration.expectRecovered(operator);
    });
    await removeFailure();
    await migrationPage.navigateToOperators();
    await migrationPage.openSingleMigration(operator.packageName);
    await migrationPage.reviewMigration();
    await migrationPage.acknowledgeRecovery();
    await migration.withOperandContinuity([operator], async () => {
      await migrationPage.startMigration();
      await expect(migrationPage.getResult(operator.subscriptionName)).toContainText(
        'migrated to OLM v1 cluster extensions successfully',
        { timeout: 300_000 },
      );
      await migration.expectMigrated(operator);
    });
  });

  test('allows confirmed rollback of a halted migration and preserves successful bulk operators', async ({
    migration,
    migrationPage,
  }) => {
    // F-4 (explicit recovery), F-5, F-8, F-11.
    const failed = await migration.install(PACKAGES.first);
    const successful = await migration.install(PACKAGES.second);
    await migrationPage.navigateToOperators();
    await migrationPage.openBulkMigration([failed.packageName, successful.packageName]);
    await migrationPage.reviewMigration();
    await migrationPage.acknowledgeRecovery();
    await migration.denyMigration(failed, 'halt');
    await migration.withOperandContinuity([failed, successful], async () => {
      await migrationPage.startMigration();
      await expect(migrationPage.getResult(failed.subscriptionName, 'failure')).toContainText(
        'Console migration fixture: halt failure',
        { timeout: 300_000 },
      );
      await expect(migrationPage.getResult(failed.subscriptionName, 'failure')).not.toContainText(
        'console automatically restored OLM (Classic) Operator management',
      );
      await expect(migrationPage.getResult(failed.subscriptionName, 'failure')).toContainText(
        'target migration resources may be active',
      );
      await expect(migrationPage.getResult(successful.subscriptionName)).toContainText(
        'migrated to OLM v1 cluster extensions successfully',
        { timeout: 300_000 },
      );
      await migration.expectMigrated(successful);
    });
    await expect(migrationPage.getProgress()).toContainText('2 of 2 Operators processed');
    await expect(migrationPage.getProgress()).toContainText('completed with errors');
    await migration.expectAbsent(TARGET_GROUP, 'v1', 'clusterextensions', failed.subscriptionName);
    await migration.expectAbsent(
      OLM_GROUP,
      'v1alpha1',
      'subscriptions',
      failed.subscriptionName,
      failed.namespace,
    );
    await migration.expectPreservedMigration(failed);
    const successfulExtension = await migration.getExtension(successful);
    await migrationPage.openRollback(failed.subscriptionName);
    await expect(migrationPage.getRollbackDialog()).toContainText(
      'Rollback removes the ClusterExtension and ClusterObjectSets',
    );
    await expect(
      migrationPage.getRollbackDialog().getByRole('button', { name: 'Roll back', exact: true }),
    ).toBeDisabled();
    await migrationPage.cancelRollback();
    await migration.expectPreservedMigration(failed);
    await migration.expectAbsent(
      OLM_GROUP,
      'v1alpha1',
      'subscriptions',
      failed.subscriptionName,
      failed.namespace,
    );
    await migrationPage.openRollback(failed.subscriptionName);
    await migration.withOperandContinuity([failed, successful], async () => {
      await migrationPage.startRollback();
      await expect(migrationPage.getRollbackResult(failed.subscriptionName)).toContainText(
        'to OLM (Classic) Operator management',
        { timeout: 300_000 },
      );
      await migration.expectRecovered(failed);
      await migration.expectAbsent(
        TARGET_GROUP,
        'v1',
        'clusterobjectsets',
        `${failed.subscriptionName}-1`,
      );
      await migration.expectMigrated(successful);
    });
    const unchangedExtension = await migration.getExtension(successful);
    expect(unchangedExtension.metadata.uid).toBe(successfulExtension.metadata.uid);
    expect(unchangedExtension.spec).toEqual(successfulExtension.spec);
  });

  test('rolls back a failed installed ClusterExtension and retries migration with its operands preserved', async ({
    migration,
    migrationPage,
  }) => {
    // F-4/F-5: failure recovery, not rollback of a successful migration.
    const { operator, originalSubscription } = await prepareInstalledTargetFailure(
      migration,
      migrationPage,
    );
    await migrationPage.openRollback(operator.subscriptionName);
    await migration.withOperandContinuity([operator], async () => {
      await migrationPage.startRollback();
      await expect(migrationPage.getRollbackResult(operator.subscriptionName)).toContainText(
        'to OLM (Classic) Operator management',
        { timeout: 300_000 },
      );
      await migration.expectRecovered(operator);
      await migration.expectAbsent(
        TARGET_GROUP,
        'v1',
        'clusterobjectsets',
        `${operator.subscriptionName}-1`,
      );
      expect((await migration.getSubscription(operator)).spec).toEqual(originalSubscription.spec);
      await migration.createOperand(operator, 'after-explicit-rollback');
    });
    await migrationPage.navigateToOperators();
    await expect(migrationPage.getStatus(operator.packageName)).toHaveText('Eligible', {
      timeout: 120_000,
    });
    await migrationPage.openSingleMigration(operator.packageName);
    await migrationPage.reviewMigration();
    await migrationPage.acknowledgeRecovery();
    await migration.withOperandContinuity([operator], async () => {
      await migrationPage.startMigration();
      await expect(migrationPage.getResult(operator.subscriptionName)).toContainText(
        'migrated to OLM v1 cluster extensions successfully',
        { timeout: 300_000 },
      );
      await migration.expectMigrated(operator);
    });
  });

  test('reports failed rollback and retries recovery without changing a successful bulk operator', async ({
    migration,
    migrationPage,
  }) => {
    const successful = await migration.install(PACKAGES.second);
    const { operator, originalSubscription, extension } = await prepareInstalledTargetFailure(
      migration,
      migrationPage,
      successful,
    );
    const successfulExtension = await migration.getExtension(successful);
    const removeFailure = await migration.denyRollback(operator);
    await migration.withOperandContinuity([operator, successful], async () => {
      try {
        await migrationPage.openRollback(operator.subscriptionName);
        await migrationPage.startRollback();
        await expect(
          migrationPage.getRollbackResult(operator.subscriptionName, 'failure'),
        ).toContainText('Console migration fixture: rollback deletion denied', {
          timeout: 120_000,
        });
        await expect(
          migrationPage.getRollbackResult(operator.subscriptionName, 'failure'),
        ).toContainText('console kept the recovery data');
        expect((await migration.getExtension(operator)).metadata.uid).toBe(extension.metadata.uid);
        await migration.expectAbsent(
          OLM_GROUP,
          'v1alpha1',
          'subscriptions',
          operator.subscriptionName,
          operator.namespace,
        );
        await migration.expectPreservedMigration(operator);
      } finally {
        await removeFailure();
      }
      await migrationPage.openRollback(operator.subscriptionName, true);
      await migrationPage.startRollback();
      await expect(migrationPage.getRollbackResult(operator.subscriptionName)).toContainText(
        'to OLM (Classic) Operator management',
        { timeout: 300_000 },
      );
      await migration.expectRecovered(operator);
      await migration.expectAbsent(
        TARGET_GROUP,
        'v1',
        'clusterobjectsets',
        `${operator.subscriptionName}-1`,
      );
      expect((await migration.getSubscription(operator)).spec).toEqual(originalSubscription.spec);
      await migration.createOperand(operator, 'after-rollback-retry');
      const unchangedExtension = await migration.getExtension(successful);
      expect(unchangedExtension.metadata.uid).toBe(successfulExtension.metadata.uid);
      expect(unchangedExtension.spec).toEqual(successfulExtension.spec);
    });
  });

  test('automatically recovers a failed bulk operator, continues the batch, and retries it independently', async ({
    migration,
    migrationPage,
  }) => {
    // F-4, F-5, F-8: automatic rollback before target creation does not change successful operators.
    const failed = await migration.install(PACKAGES.first);
    const successful = await migration.install(PACKAGES.second);
    const originalSubscription = await migration.getSubscription(failed);
    await migrationPage.navigateToOperators();
    await migrationPage.openBulkMigration([failed.packageName, successful.packageName]);
    await migrationPage.reviewMigration();
    await migrationPage.acknowledgeRecovery();
    const removeFailure = await migration.denyMigration(failed, 'recover');
    await migration.withOperandContinuity([failed, successful], async () => {
      await migrationPage.startMigration();
      await expect(migrationPage.getResult(failed.subscriptionName, 'failure')).toContainText(
        'console automatically restored OLM (Classic) Operator management',
        { timeout: 300_000 },
      );
      await expect(migrationPage.getResult(failed.subscriptionName, 'failure')).toContainText(
        'Console migration fixture: recover failure',
      );
      await migration.expectRecovered(failed);
      await migration.expectAbsent(
        TARGET_GROUP,
        'v1',
        'clusterobjectsets',
        `${failed.subscriptionName}-1`,
      );
      expect((await migration.getSubscription(failed)).spec).toEqual(originalSubscription.spec);
      await expect(migrationPage.getResult(successful.subscriptionName)).toContainText(
        'migrated to OLM v1 cluster extensions successfully',
        { timeout: 300_000 },
      );
      await migration.expectMigrated(successful);
    });
    await expect(migrationPage.getProgress()).toContainText('2 of 2 Operators processed');
    await expect(migrationPage.getProgress()).toContainText('completed with errors');
    const successfulExtension = await migration.getExtension(successful);
    await removeFailure();
    await migrationPage.navigateToOperators();
    await expect(migrationPage.getOperatorRow(successful.packageName)).not.toBeAttached();
    await expect(migrationPage.getStatus(failed.packageName)).toHaveText('Eligible', {
      timeout: 120_000,
    });
    await migrationPage.openSingleMigration(failed.packageName);
    await migrationPage.reviewMigration();
    await migrationPage.acknowledgeRecovery();
    await migration.withOperandContinuity([failed, successful], async () => {
      await migrationPage.startMigration();
      // The original failed toast remains in the drawer; the retry has its own success result.
      await expect(migrationPage.getResult(failed.subscriptionName)).toContainText(
        'migrated to OLM v1 cluster extensions successfully',
        { timeout: 300_000 },
      );
      await migration.expectMigrated(failed);
    });
    const unchangedExtension = await migration.getExtension(successful);
    expect(unchangedExtension.metadata.uid).toBe(successfulExtension.metadata.uid);
    expect(unchangedExtension.spec).toEqual(successfulExtension.spec);
  });
});

// These interruptions use a real fixture-scoped admission policy to hold the
// ClusterExtension status pending. The migration API is never intercepted.
test.describe('Operator migration interruptions', { lock: OLM_CLUSTER_STATE_LOCK }, () => {
  // Logout must not revoke the saved session shared by other workers.
  test.use({ storageState: { cookies: [], origins: [] } });
  test.setTimeout(900_000);
  const options = {
    annotation: {
      type: 'no-auto-reauth',
      description: 'Authentication changes are part of this test',
    },
  };
  const checkInterruption = async (
    interruption: 'refresh' | 'new browser' | 'logout and login' | 'backend replacement',
    {
      migration,
      migrationPage,
      page,
      browser,
      baseURL,
    }: {
      migration: OperatorMigrationFixture;
      migrationPage: OperatorMigrationPage;
      page: Page;
      browser: Browser;
      baseURL?: string;
    },
  ) => {
    if (interruption === 'logout and login') {
      test.skip(migration.authDisabled, 'Logout requires an authenticated Console');
    }
    if (interruption === 'backend replacement') {
      test.skip(
        ['localhost', '127.0.0.1', '::1'].includes(new URL(baseURL).hostname),
        'Use the cluster Console route: deleting pods cannot restart a locally served backend',
      );
    }
    const first = await migration.install(PACKAGES.first);
    const second = await migration.install(PACKAGES.second);
    await migrationPage.navigateToOperators();
    await migrationPage.openBulkMigration([first.packageName, second.packageName]);
    await migrationPage.reviewMigration();
    await migrationPage.acknowledgeRecovery();
    const release = await migration.holdMigration(first);
    await migration.withOperandContinuity([first, second], async () => {
      await migrationPage.startMigration();
      await migration.expectHeldMigration(first);
      await expect(migrationPage.getProgress()).toContainText('0 of 2 Operators processed');
      let returnedPage = migrationPage;
      let replacementBrowser: Browser | undefined;
      try {
        if (interruption === 'new browser') {
          await page.goto('about:blank');
          replacementBrowser = await browser.browserType().launch({
            ...test.info().project.use.launchOptions,
            channel: test.info().project.use.channel,
          });
          const context = await replacementBrowser.newContext({
            baseURL,
            ignoreHTTPSErrors: true,
            viewport: { width: 1920, height: 1080 },
          });
          const freshPage = await context.newPage();
          await loginFromEnv(freshPage, 'admin', baseURL);
          returnedPage = new OperatorMigrationPage(freshPage);
        } else if (interruption === 'logout and login') {
          const masthead = new MastheadPage(page);
          await masthead.openUserDropdown();
          await masthead.logOut();
          await loginFromEnv(page, 'admin', baseURL);
        } else if (interruption === 'backend replacement') {
          await migration.restartConsolePods();
          await page.reload();
          await loginFromEnv(page, 'admin', baseURL);
        } else {
          await migrationPage.minimizeProgress();
          await page.reload();
        }
        await expect(returnedPage.getProgress()).toBeVisible({ timeout: 90_000 });
        await expect(returnedPage.getProgress()).toContainText('0 of 2 Operators processed');
        await release();
        for (const operator of [first, second]) {
          await expect(returnedPage.getResult(operator.subscriptionName)).toContainText(
            'migrated to OLM v1 cluster extensions successfully',
            { timeout: 300_000 },
          );
          await migration.expectMigrated(operator);
        }
        await expect(returnedPage.getProgress()).toContainText('2 of 2 Operators processed');
      } finally {
        await replacementBrowser?.close();
        if (interruption === 'new browser') await page.goto('/');
      }
    });
  };

  test(
    'restores progress and continues the batch after refresh',
    options,
    async ({ migration, migrationPage, page, browser, baseURL }) => {
      await checkInterruption('refresh', { migration, migrationPage, page, browser, baseURL });
    },
  );

  test(
    'restores progress and continues the batch after new browser',
    options,
    async ({ migration, migrationPage, page, browser, baseURL }) => {
      await checkInterruption('new browser', { migration, migrationPage, page, browser, baseURL });
    },
  );

  test(
    'restores progress and continues the batch after logout and login',
    options,
    async ({ migration, migrationPage, page, browser, baseURL }) => {
      await checkInterruption('logout and login', {
        migration,
        migrationPage,
        page,
        browser,
        baseURL,
      });
    },
  );

  test(
    'restores progress and continues the batch after backend replacement',
    options,
    async ({ migration, migrationPage, page, browser, baseURL }) => {
      await checkInterruption('backend replacement', {
        migration,
        migrationPage,
        page,
        browser,
        baseURL,
      });
    },
  );
});

// Recovery interruption is held with a fixture finalizer on the real failed target.
test.describe('Operator rollback interruptions', { lock: OLM_CLUSTER_STATE_LOCK }, () => {
  // Logout must not revoke the saved session shared by other workers.
  test.use({ storageState: { cookies: [], origins: [] } });
  test.setTimeout(900_000);
  const options = {
    annotation: {
      type: 'no-auto-reauth',
      description: 'Authentication changes are part of this test',
    },
  };
  const checkRollbackInterruption = async (
    interruption: 'refresh' | 'new browser' | 'logout and login' | 'backend replacement',
    {
      migration,
      migrationPage,
      page,
      browser,
      baseURL,
    }: {
      migration: OperatorMigrationFixture;
      migrationPage: OperatorMigrationPage;
      page: Page;
      browser: Browser;
      baseURL?: string;
    },
  ) => {
    if (interruption === 'logout and login')
      test.skip(migration.authDisabled, 'Logout requires an authenticated Console');
    if (interruption === 'backend replacement')
      test.skip(
        ['localhost', '127.0.0.1', '::1'].includes(new URL(baseURL).hostname),
        'Use the cluster Console route to restart the backend',
      );
    const { operator, originalSubscription } = await prepareInstalledTargetFailure(
      migration,
      migrationPage,
    );
    const release = await migration.holdRollback(operator);
    let replacementBrowser: Browser | undefined;
    try {
      await migrationPage.openRollback(operator.subscriptionName);
      await migration.withOperandContinuity([operator], async () => {
        await migrationPage.startRollback();
        await migration.expectHeldRollback(operator);
        await expect(migrationPage.getRollbackProgress()).toContainText(
          '0 of 1 Operators processed',
        );
        let returnedPage = migrationPage;
        if (interruption === 'new browser') {
          await page.goto('about:blank');
          replacementBrowser = await browser.browserType().launch({
            ...test.info().project.use.launchOptions,
            channel: test.info().project.use.channel,
          });
          const context = await replacementBrowser.newContext({
            baseURL,
            ignoreHTTPSErrors: true,
            viewport: { width: 1920, height: 1080 },
          });
          const freshPage = await context.newPage();
          await loginFromEnv(freshPage, 'admin', baseURL);
          returnedPage = new OperatorMigrationPage(freshPage);
        } else if (interruption === 'logout and login') {
          const masthead = new MastheadPage(page);
          await masthead.openUserDropdown();
          await masthead.logOut();
          await loginFromEnv(page, 'admin', baseURL);
        } else if (interruption === 'backend replacement') {
          await migration.restartConsolePods();
          await page.reload();
          await loginFromEnv(page, 'admin', baseURL);
        } else {
          await page.reload();
        }
        await expect(returnedPage.getRollbackProgress()).toBeVisible({ timeout: 90_000 });
        await expect(returnedPage.getRollbackProgress()).toContainText(
          '0 of 1 Operators processed',
        );
        await migration.expectHeldRollback(operator);
        await release();
        await expect(returnedPage.getRollbackResult(operator.subscriptionName)).toContainText(
          'to OLM (Classic) Operator management',
          { timeout: 300_000 },
        );
        await migration.expectRecovered(operator);
        await migration.expectAbsent(
          TARGET_GROUP,
          'v1',
          'clusterobjectsets',
          `${operator.subscriptionName}-1`,
        );
        expect((await migration.getSubscription(operator)).spec).toEqual(originalSubscription.spec);
        await migration.createOperand(operator, 'after-interrupted-rollback');
        await expect(returnedPage.getRollbackProgress()).toContainText(
          '1 of 1 Operators processed',
        );
      });
    } finally {
      await release();
      await replacementBrowser?.close();
      if (interruption === 'new browser') await page.goto('/');
    }
  };

  test(
    'restores rollback progress and finishes recovery after refresh',
    options,
    async ({ migration, migrationPage, page, browser, baseURL }) => {
      await checkRollbackInterruption('refresh', {
        migration,
        migrationPage,
        page,
        browser,
        baseURL,
      });
    },
  );

  test(
    'restores rollback progress and finishes recovery after a new browser',
    options,
    async ({ migration, migrationPage, page, browser, baseURL }) => {
      await checkRollbackInterruption('new browser', {
        migration,
        migrationPage,
        page,
        browser,
        baseURL,
      });
    },
  );

  test(
    'restores rollback progress and finishes recovery after logout and login',
    options,
    async ({ migration, migrationPage, page, browser, baseURL }) => {
      await checkRollbackInterruption('logout and login', {
        migration,
        migrationPage,
        page,
        browser,
        baseURL,
      });
    },
  );

  test(
    'restores rollback progress and finishes recovery after backend replacement',
    options,
    async ({ migration, migrationPage, page, browser, baseURL }) => {
      await checkRollbackInterruption('backend replacement', {
        migration,
        migrationPage,
        page,
        browser,
        baseURL,
      });
    },
  );
});
