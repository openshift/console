import { test, expect } from '../../fixtures';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';
import { OperatorDetailsPage, TestOperandProps } from '../../pages/operator-details-page';
import { operatorTestCleanup, cleanupOperatorResources, cleanupAllOperatorsByPackageName } from '../../test-utils/operator-cleanup';
import { generateTestNamespace } from '../../test-utils/test-namespace';

const testOperator = {
  name: 'Data Grid',
  operatorCardTestID: 'operator-Data Grid',
  urlName: 'datagrid-operator.v8.6.5',
};

const testOperand: TestOperandProps = {
  name: 'Infinispan',
  group: 'infinispan.org',
  version: 'v1',
  kind: 'Infinispan',
  createActionID: 'list-page-create-dropdown-item-infinispan.org~v1~Infinispan',
  exampleName: 'example-infinispan',
};

const operatorPackageName = 'datagrid';
const globalNamespace = 'openshift-operators';

// Track namespaces created by this test suite
const ownedNamespaces = new Set<string>();

// Enhanced cleanup wrapper for Data Grid operator in single namespace tests
async function cleanupDataGridOperatorSingleNamespace(k8sClient: any) {
  await cleanupOperatorResources(k8sClient, {
    operatorPackageName,
    operandPlural: 'infinispans',
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

    // Clean up only namespaces created by this test worker (from aborted runs)
    try {
      for (const nsName of ownedNamespaces) {
        console.log(`Cleaning up owned test namespace: ${nsName}`);
        await operatorTestCleanup(k8sClient, {
          operatorPackageName,
          operandPlural: 'infinispans',
          testOperand,
          targetNamespace: nsName,
          crdPatterns: ['.infinispan.org'], // Clean up Data Grid CRDs
        });
      }
    } catch (error) {
      console.log('Error cleaning up owned test namespaces:', error.message);
    }

    // Wait for cleanup to propagate
    await page.waitForTimeout(5000); // Reduced from 15s to 5s
    console.log('=== SINGLE NAMESPACE BEFORE EACH: Cleanup complete ===');
  });

  test.afterEach(async ({ k8sClient }) => {
    console.log('=== SINGLE NAMESPACE AFTER EACH: Starting verification ===');

    try {
      // Check each owned namespace for UI uninstall completion (but don't be as aggressive as beforeEach)
      for (const nsName of ownedNamespaces) {
        console.log(`🔍 Checking UI uninstall for namespace: ${nsName}`);
        await operatorTestCleanup(k8sClient, {
          operatorPackageName,
          operandPlural: 'infinispans',
          testOperand,
          targetNamespace: nsName,
          crdPatterns: ['.infinispan.org'], // Clean up Data Grid CRDs
          waitForUiUninstall: true,
          uiUninstallTimeoutMs: 10_000, // Brief delay before cleanup
        });
      }
    } catch (error) {
      console.log(`⚠️ Verification error: ${error.message}`);
    }

    // Clear tracked namespaces for this test
    ownedNamespaces.clear();
    console.log('=== SINGLE NAMESPACE AFTER EACH: Complete ===');
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
    ownedNamespaces.add(testNamespace);

    await test.step('Install operator in new test namespace', async () => {
      try {
        cleanup.trackNamespace(testNamespace);
        await installPage.installOperatorInNewNamespace(
          testOperator.name,
          testOperator.operatorCardTestID,
          testNamespace,
        );
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

      // Switch to global namespace and verify this specific operator is not there
      await installedOperatorsPage.verifyOperatorNotInstalledInNamespace(testOperator.name, globalNamespace);
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
    });

    await test.step('Create operand', async () => {
      await operatorDetailsPage.createOperand(testOperand, false);
      await expect(page.getByTestId(testOperand.exampleName)).toBeVisible();
    });

    await test.step('Navigate to operand details', async () => {
      await operatorDetailsPage.clickOperandLink(testOperand.exampleName);
      await expect(page).toHaveURL(url => url.pathname.endsWith(`/${testOperand.exampleName}`));
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
  });
});
