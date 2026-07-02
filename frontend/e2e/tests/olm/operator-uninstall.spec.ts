import { test, expect } from '../../fixtures';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';
import { OperatorDetailsPage, type TestOperandProps } from '../../pages/operator-details-page';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { ModalPage } from '../../pages/modal-page';
import { generateTestNamespace } from '../../test-utils/test-namespace';
import { createOperatorTestHooks, type OperatorTestConfig } from '../../test-utils/olm-test-cleanup';

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
  createActionID: 'list-page-create-dropdown-item-infinispan.org~v1~Backup',
  exampleName: 'example-backup',
};

// Test configuration for shared cleanup
const testConfig: OperatorTestConfig = {
  operatorName: testOperator.name,
  operatorCardTestID: testOperator.operatorCardTestID,
  packageName: 'datagrid',
  operand: {
    ...testOperand,
    plural: 'backups',
  },
  globalNamespace: 'openshift-operators',
};

// Create shared test hooks
const testHooks = createOperatorTestHooks(testConfig);


test.describe('Testing uninstall of Data Grid Operator', { tag: ['@admin'] }, () => {
  test.describe.configure({ timeout: 300_000 }); // 5 minutes for operator operations

  // Use shared test hooks for consistent cleanup
  test.beforeAll(testHooks.beforeAll);

  test.afterAll(testHooks.afterAll);


  test(`Installs ${testOperator.name} Operator and ${testOperand.name} Instance, tests uninstall scenarios, then successfully uninstalls`, async ({ page, k8sClient, cleanup }) => {
    const installPage = new OperatorInstallPage(page);
    const installedOperatorsPage = new InstalledOperatorsPage(page);
    const operatorDetailsPage = new OperatorDetailsPage(page);
    const modalPage = new ModalPage(page);

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
      // Verify operator installation succeeded
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

    await test.step('Successfully uninstall operator (without operands)', async () => {
      // Navigate back to operator details page to ensure clean state
      await installedOperatorsPage.navigateToOperatorDetails(testOperator.name, testOperator.urlName, testNamespace);

      // Uninstall operator normally (without trying to delete operands since none exist)
      await operatorDetailsPage.uninstallOperator();

      // Verify operator no longer exists
      await installedOperatorsPage.verifyOperatorNotExists(testOperator.name);
    });

    await test.step('Verify operand instance is deleted', async () => {
      // Verify operand is deleted via K8s API (should throw 404)
      await expect(async () => {
        await k8sClient.getCustomResource(
          testOperand.group,
          testOperand.version,
          testNamespace,
          'backups',
          testOperand.exampleName
        );
      }).rejects.toThrow();
    });

  });
});
