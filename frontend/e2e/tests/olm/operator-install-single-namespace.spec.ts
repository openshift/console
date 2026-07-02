import { test, expect } from '../../fixtures';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';
import { OperatorDetailsPage, TestOperandProps } from '../../pages/operator-details-page';
import { cleanupOperatorResources, cleanupAllOperatorsByPackageName } from '../../test-utils/operator-cleanup';
import { generateTestNamespace } from '../../test-utils/test-namespace';

const testOperator = {
  name: 'Data Grid',
  operatorCardTestID: 'operator-Data Grid',
  urlName: 'datagrid-operator.v8.6.5',
};

const testOperand: TestOperandProps = {
  name: 'Backup',
  group: 'infinispan.org',
  version: 'v1',
  kind: 'Backup',
  // createActionID removed - let it use the default create flow
  exampleName: 'example-backup',
};

const operatorPackageName = 'datagrid';
const globalNamespace = 'openshift-operators';

// Enhanced cleanup wrapper for Data Grid operator in single namespace tests
async function cleanupDataGridOperatorSingleNamespace(k8sClient: any) {
  await cleanupOperatorResources(k8sClient, {
    operatorPackageName,
    operandPlural: 'backups',
    testOperand,
    namespace: globalNamespace, // Will also clean global namespace to be safe
  });
}

test.describe(`Single Namespace Operator Installation - ${testOperator.name}`, { tag: ['@admin'] }, () => {
  test.describe.configure({ timeout: 300_000 }); // 5 minutes instead of 15

  test.beforeEach(async ({ k8sClient, page }) => {
    console.log('=== SINGLE NAMESPACE BEFORE EACH: Starting cleanup ===');

    // First do aggressive cluster-wide cleanup of all operators for this package
    await cleanupAllOperatorsByPackageName(k8sClient, operatorPackageName);

    // Then do namespace-specific cleanup
    await cleanupDataGridOperatorSingleNamespace(k8sClient);

    // Also clean up any test namespaces that might have conflicting OperatorGroups
    try {
      const namespaces = await k8sClient.listNamespaces();
      const testNamespaces = namespaces.filter((ns: any) => ns.metadata.name.startsWith('test-'));

      for (const testNs of testNamespaces) {
        const nsName = (testNs as any)?.metadata?.name;
        if (nsName) {
          console.log(`Cleaning up test namespace: ${nsName}`);
          await cleanupOperatorResources(k8sClient, {
            operatorPackageName,
            operandPlural: 'backups',
            namespace: nsName,
          });
        }
      }
    } catch (error) {
      console.log('Error cleaning up test namespaces:', error.message);
    }

    // Wait for cleanup to propagate
    await page.waitForTimeout(5000); // Reduced from 15s to 5s
    console.log('=== SINGLE NAMESPACE BEFORE EACH: Cleanup complete ===');
  });

  test.afterEach(async ({ k8sClient }) => {
    console.log('=== SINGLE NAMESPACE AFTER EACH: Starting verification ===');

    // Just verify that the UI uninstall worked - don't force cleanup
    // since this test includes UI-driven uninstall as part of the test
    await new Promise(resolve => setTimeout(resolve, 5000)); // Give UI uninstall time to complete

    try {
      const remaining = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
      const stillThere = remaining.filter((op: any) => op.metadata.name?.includes(operatorPackageName));

      if (stillThere.length > 0) {
        console.log('⚠️  Note: Some operators still present after UI uninstall:', stillThere.map((op: any) => op.metadata.name));
        // Could optionally do cleanup here if UI uninstall failed, but let's see what happens first
      } else {
        console.log('✅ UI uninstall appears successful - no operators remaining');
      }
    } catch (error) {
      console.log('Could not verify cleanup state:', error.message);
    }

    console.log('=== SINGLE NAMESPACE AFTER EACH: Verification complete ===');
  });

  test(`Installs ${testOperator.name} operator in test namespace and manages ${testOperand.name} operand instance`, async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const installPage = new OperatorInstallPage(page);
    const installedOperatorsPage = new InstalledOperatorsPage(page);
    const operatorDetailsPage = new OperatorDetailsPage(page);

    const testNamespace = generateTestNamespace();

    await test.step('Install operator in new test namespace', async () => {
      try {
        await installPage.installOperatorInNewNamespace(
          testOperator.name,
          testOperator.operatorCardTestID,
          testNamespace,
        );
        cleanup.trackNamespace(testNamespace);
      } catch (error) {
        if (error.message?.includes('operator-Data Grid')) {
          test.skip(true, 'Data Grid operator not available in this cluster environment');
        }
        throw error;
      }
    });

    await test.step('Verify operator installation succeeded in test namespace', async () => {
      await installedOperatorsPage.verifyOperatorInstallationSucceeded(testOperator.name);
    });

    await test.step('Navigate to operator details page and verify sections', async () => {
      await installedOperatorsPage.navigateToOperatorDetails(testOperator.name, testOperator.urlName, testNamespace);
      await operatorDetailsPage.verifyDetailsPageSections();
    });

    await test.step('Verify operator is NOT installed globally (isolation test)', async () => {
      // This is a key verification that distinguishes single namespace from global installation
      await installedOperatorsPage.navigateToInstalledOperators();

      // Switch to global namespace and verify operator is not there
      await installedOperatorsPage.selectNamespace(globalNamespace);

      const emptyState = page.getByTestId('console-empty-state');
      await expect(emptyState.or(page.locator('[data-test="msg-box-title"]'))).toContainText(
        /No Operators found|No results found/,
      );
    });

    await test.step('Navigate to operator details', async () => {
      await installedOperatorsPage.navigateToInstalledOperators();
      await installedOperatorsPage.selectNamespace(testNamespace);

      // Wait for loading to complete after namespace switch
      await expect(page.locator('.loading-skeleton--table')).not.toBeAttached({ timeout: 30_000 });


      // Wait for operator to appear in the new namespace
      await expect(installedOperatorsPage.getOperatorRow(testOperator.name)).toBeVisible({ timeout: 60_000 });

      await installedOperatorsPage.navigateToOperatorDetails(testOperator.name, testOperator.urlName, testNamespace);
      await operatorDetailsPage.verifyDetailsPageSections();
      // await operatorDetailsPage.navigateToOperandTab(testOperand.name, false);
    });

    await test.step('Create operand', async () => {
      await operatorDetailsPage.createOperand(testOperand, false);
      await expect(page.getByTestId(testOperand.exampleName)).toBeVisible();
    });

    await test.step('Navigate to operand details', async () => {
      await operatorDetailsPage.clickOperandLink(testOperand.exampleName);
      await expect(page).toHaveURL(new RegExp(`${testOperand.exampleName}$`));
    });

    await test.step('Delete operand instance', async () => {
      await operatorDetailsPage.deleteOperand(testOperand, false);
    });

    await test.step('Navigate back to operand instances and verify deletion', async () => {
      await installedOperatorsPage.navigateToOperatorDetails(testOperator.name, testOperator.urlName, testNamespace);
      await operatorDetailsPage.navigateToOperandTab(testOperand.name, false);
      await operatorDetailsPage.verifyOperandNotExistsOnCurrentTab(testOperand.exampleName);
    });

    await test.step('Uninstall operator from namespace', async () => {
      await operatorDetailsPage.uninstallOperator();
      await installedOperatorsPage.verifyOperatorNotExists(testOperator.name);
    });

    await test.step('Final cleanup - ensure no orphaned resources', async () => {
      // Additional cleanup to ensure no orphaned resources
      await cleanupOperatorResources(k8sClient, {
        operatorPackageName,
        operandPlural: 'backups',
        testOperand,
        namespace: testNamespace,
      });
    });

    // Note: The test namespace will be automatically cleaned up via cleanup.trackNamespace()
  });
});
