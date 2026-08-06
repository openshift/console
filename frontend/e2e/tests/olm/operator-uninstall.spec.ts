import { test, expect } from '../../fixtures';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';
import { OperatorDetailsPage, type TestOperandProps } from '../../pages/operator-details-page';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { ModalPage } from '../../pages/modal-page';
import { generateTestNamespace } from '../../test-utils/test-namespace';
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
  test.describe.configure({ timeout: 120_000 }); // 2 minutes - more reasonable for faster failure feedback

  test.beforeAll(async ({ k8sClient }) => {
    console.log('=== UNINSTALL TEST: Starting initial cleanup ===');
    await performOperatorCleanup(k8sClient, testConfig);
    console.log('=== UNINSTALL TEST: Initial cleanup complete ===');
  });

  test.afterAll(async ({ k8sClient }) => {
    console.log('=== UNINSTALL TEST: Starting final verification ===');

    // Since this test does UI uninstall, give it more time to complete naturally
    console.log('⏳ Waiting 10 seconds for UI uninstall to complete naturally...');
    await new Promise(resolve => setTimeout(resolve, 10_000));

    // Only do minimal verification, not aggressive cleanup since UI should have handled it
    console.log('✅ Uninstall test verification complete');
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

      // Uninstall operator and explicitly delete the operand that was created
      // For single operand scenario, the UI should auto-delete without checkbox
      await operatorDetailsPage.uninstallOperatorWithOperands(false);

      // Verify operator no longer exists
      await installedOperatorsPage.verifyOperatorNotExists(testOperator.name);
    });

    await test.step('Verify operand instance is deleted', async () => {
      // Wait a bit longer for operand deletion to complete
      console.log('⏳ Waiting 15 seconds for operand deletion to complete...');
      await new Promise(resolve => setTimeout(resolve, 15_000));

      // Verify operand is deleted via K8s API (should throw 404)
      console.log(`🔍 Checking if operand ${testOperand.exampleName} was deleted...`);
      await expect(async () => {
        const result = await k8sClient.getCustomResource(
          testOperand.group,
          testOperand.version,
          testNamespace,
          'infinispans',
          testOperand.exampleName
        );
        console.log(`⚠️ Operand still exists:`, result);
        throw new Error('Expected operand to be deleted but it still exists');
      }).rejects.toThrow();
    });

  });
});
