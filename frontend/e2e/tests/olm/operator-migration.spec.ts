/* eslint playwright/expect-expect: ["warn", { "assertFunctionNames": ["expect", "checkIneligibleOperator", "checkInterruption"] }] */
import type { Browser, Page } from '@playwright/test';
import type { OperatorMigrationFixture } from '../../fixtures/operator-migration-fixture';
import { expect } from '../../fixtures';
import { test, PACKAGES, OLM_GROUP, TARGET_GROUP } from '../../fixtures/operator-migration-fixture';
import { OLM_CLUSTER_STATE_LOCK } from '../../utils/locks';
import { OperatorMigrationPage } from '../../pages/operator-migration-page';
import { MastheadPage } from '../../pages/masthead-page';
import { loginFromEnv } from '../../setup/login-helper';

// TP-OCPSTRAT-2692-OLMv0-OLMv1-MIGRATION-TP-v1.2:
// https://github.com/miyadav/test-plans/pull/1
// Real catalogs and cluster outcomes; no migration API response interception.
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
      await migrationPage.reviewMigration();
      await expect(migrationPage.getStartButton()).toBeDisabled();
      await migrationPage.acknowledgeRecovery();
      await expect(migrationPage.getStartButton()).toBeEnabled();
      await migration.withOperandContinuity([operator], async () => {
        await migrationPage.startMigration();
        await expect(migrationPage.getDialog()).toBeHidden();
        await expect(migrationPage.getProgress()).toBeVisible();
        await expect(migrationPage.getResult(operator.subscriptionName)).toContainText(
          'migrated to OLM v1 successfully',
          { timeout: 300_000 },
        );
        await migration.expectMigrated(operator);
      });
      await expect(migrationPage.getProgress()).toContainText('1 of 1 operators processed');
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

  test('removes a blocked operator from a bulk selection and migrates both eligible operators', async ({
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
    await migrationPage.openBulkMigration([
      first.packageName,
      second.packageName,
      blocked.packageName,
    ]);
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
          'migrated to OLM v1 successfully',
          { timeout: 300_000 },
        );
        await migration.expectMigrated(operator);
      }
    });
    await expect(migrationPage.getProgress()).toContainText('2 of 2 operators processed');
    expect((await migration.getSubscription(blocked)).status.installedCSV).toBe(blocked.csvName);
    await migration.expectAbsent(TARGET_GROUP, 'v1', 'clusterextensions', blocked.subscriptionName);
  });

  const checkIneligibleOperator = async (
    migration: OperatorMigrationFixture,
    migrationPage: OperatorMigrationPage,
    packageName: string,
    reason: string,
  ) => {
    // F-7: independently constructed catalog fixtures, rather than scan-derived labels.
    const operator = await migration.install(packageName);
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
        'rolled back automatically',
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
        'migrated to OLM v1 successfully',
        { timeout: 300_000 },
      );
      await migration.expectMigrated(operator);
    });
  });

  test('reports a halted migration accurately and continues the remaining bulk operators', async ({
    migration,
    migrationPage,
    k8sClient,
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
        'rolled back automatically',
      );
      await expect(migrationPage.getResult(successful.subscriptionName)).toContainText(
        'migrated to OLM v1 successfully',
        { timeout: 300_000 },
      );
      await migration.expectMigrated(successful);
    });
    await expect(migrationPage.getProgress()).toContainText('2 of 2 operators processed');
    await expect(migrationPage.getProgress()).toContainText('completed with errors');
    await migration.expectAbsent(TARGET_GROUP, 'v1', 'clusterextensions', failed.subscriptionName);
    await migration.expectAbsent(
      OLM_GROUP,
      'v1alpha1',
      'subscriptions',
      failed.subscriptionName,
      failed.namespace,
    );
    // A real target resource remains available for explicit recovery after the failure.
    expect(
      await k8sClient.getClusterCustomResource(
        TARGET_GROUP,
        'v1',
        'clusterobjectsets',
        `${failed.subscriptionName}-1`,
      ),
    ).toBeTruthy();
  });
});

// These interruptions use a real fixture-scoped admission policy to hold the
// ClusterExtension status pending. The migration API is never intercepted.
test.describe('Operator migration interruptions', { lock: OLM_CLUSTER_STATE_LOCK }, () => {
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
      test.skip(
        await page.evaluate(() => window.SERVER_FLAGS.authDisabled),
        'Logout requires an authenticated Console',
      );
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
      await expect(migrationPage.getProgress()).toContainText('0 of 2 operators processed');
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
          await masthead.clickLogOut();
          // eslint-disable-next-line playwright/no-conditional-expect
          await expect(page.getByTestId('user-dropdown-toggle')).toBeHidden();
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
        await expect(returnedPage.getProgress()).toContainText('0 of 2 operators processed');
        await release();
        for (const operator of [first, second]) {
          await expect(returnedPage.getResult(operator.subscriptionName)).toContainText(
            'migrated to OLM v1 successfully',
            { timeout: 300_000 },
          );
          await migration.expectMigrated(operator);
        }
        await expect(returnedPage.getProgress()).toContainText('2 of 2 operators processed');
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
