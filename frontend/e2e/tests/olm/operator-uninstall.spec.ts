import { test, expect } from '../../fixtures';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';
import { OperatorDetailsPage, type TestOperandProps } from '../../pages/operator-details-page';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { ModalPage } from '../../pages/modal-page';
import { generateTestNamespace } from '../../test-utils/test-namespace';
import { operatorTestCleanup } from '../../test-utils/operator-cleanup';
import { performOperatorCleanup, type OperatorTestConfig } from '../../test-utils/olm-test-cleanup';

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

// Test configuration for cleanup
const testConfig: OperatorTestConfig = {
  operatorName: testOperator.name,
  operatorCardTestID: testOperator.operatorCardTestID,
  packageName: 'datagrid',
  operand: {
    ...testOperand,
    plural: 'infinispans',
  },
  globalNamespace: 'openshift-operators',
};


test.describe('Testing uninstall of Data Grid Operator', { tag: ['@admin'] }, () => {
  test.describe.configure({ timeout: 300_000 }); // 5 minutes - allow for operator install/uninstall operations

  test.beforeAll(async ({ k8sClient }) => {
    console.log('=== UNINSTALL TEST: Starting initial cleanup ===');
    await performOperatorCleanup(k8sClient, testConfig);
    console.log('=== UNINSTALL TEST: Initial cleanup complete ===');
  });

  test.afterAll(async ({ k8sClient }) => {
    console.log('=== UNINSTALL TEST: Starting final cleanup ===');

    // Since this test does UI uninstall, give it a moment then clean up remaining resources
    // (InstallPlans, Operator resources, CRDs that OpenShift doesn't auto-remove)
    await operatorTestCleanup(k8sClient, {
      operatorPackageName: testConfig.packageName,
      operandPlural: testConfig.operand?.plural || 'infinispans',
      testOperand: testConfig.operand,
      targetNamespace: testConfig.globalNamespace || 'openshift-operators',
      crdPatterns: ['.infinispan.org'], // Clean up Data Grid CRDs
      waitForUiUninstall: true,
      uiUninstallTimeoutMs: 10_000, // Brief delay before cleanup
    });

    console.log('✅ Uninstall test cleanup complete');
  });


  test(`Installs ${testOperator.name} Operator and ${testOperand.name} Instance, tests uninstall scenarios, then successfully uninstalls`, async ({ page, k8sClient, cleanup }) => {
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
        if (error?.message?.includes('operator-Data Grid')) {
          test.skip(true, 'Data Grid operator not available in this cluster environment');
        }
        throw error;
      }
    });

    await test.step('Verify operator installation and create operand', async () => {
      // Verify operator installation succeeded (with shorter timeout for faster feedback)
      await installedOperatorsPage.verifyOperatorInstallationSucceeded(testOperator.name);

      // Navigate to operator details page
      await installedOperatorsPage.navigateToOperatorDetails(testOperator.name, testOperator.urlName, testNamespace);

      // Create operand (this will navigate to the correct tab automatically)
      await operatorDetailsPage.createOperand(testOperand, false);
      await expect(page.getByTestId(testOperand.exampleName)).toBeVisible();
    });

    await test.step('Verify details page sections', async () => {
      // Navigate back to operator details page
      await installedOperatorsPage.navigateToOperatorDetails(testOperator.name, testOperator.urlName, testNamespace);

      // Verify operator details page sections exist
      await operatorDetailsPage.verifyDetailsPageSections();
    });

    await test.step('Test uninstall with "Cannot load Operands" error', async () => {
      // Set up route interception to return error for operand list API (matching Cypress pattern)
      await page.route('**/api/olm/list-operands**', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to list operands' })
        });
      });

      // Open uninstall modal without submitting
      await operatorDetailsPage.uninstallOperator(false);

      // Verify error alert appears
      await operatorDetailsPage.verifyUninstallAlert('Cannot load Operands');

      // Cancel the modal
      await operatorDetailsPage.cancelUninstall();

      // Clear the route interception for next step
      await page.unroute('**/api/olm/list-operands**');
    });

    await test.step('Successfully uninstall operator (with operands)', async () => {
      // Navigate back to operator details page to ensure clean state
      await installedOperatorsPage.navigateToOperatorDetails(testOperator.name, testOperator.urlName, testNamespace);

      // Uninstall operator and delete the operand that was created
      await operatorDetailsPage.uninstallOperatorWithOperands(true);

      // Verify operator no longer exists
      await installedOperatorsPage.verifyOperatorNotExists(testOperator.name);
    });

    await test.step('Verify operand instance is deleted', async () => {
      // Poll for operand deletion completion instead of fixed wait
      console.log(`🔍 Polling for operand ${testOperand.exampleName} deletion...`);

      await expect(async () => {
        try {
          const result = await k8sClient.getCustomResource(
            testOperand.group,
            testOperand.version,
            testNamespace,
            'infinispans',
            testOperand.exampleName
          );
          console.log(`⏳ Operand still exists, continuing to poll...`);
          throw new Error('Operand still exists');
        } catch (error) {
          if (error.message?.includes('404') || error.message?.includes('not found')) {
            console.log('✅ Operand deletion confirmed');
            return; // Success - operand is deleted
          }
          throw error; // Re-throw other errors
        }
      }).toPass({ timeout: 120_000, intervals: [5_000] }); // Poll every 5 seconds for up to 2 minutes
    });

  });
});
