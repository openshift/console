import { test, expect } from '../../fixtures';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';
import { OperatorDetailsPage, type TestOperandProps } from '../../pages/operator-details-page';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { generateTestNamespace } from '../../test-utils/test-namespace';

const testOperator = {
  name: 'Data Grid',
  operatorCardTestID: 'operator-Data Grid',
  urlName: 'datagrid-operator',
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

test.describe('Testing uninstall of Data Grid Operator', { tag: ['@admin'] }, () => {
  test.describe.configure({ timeout: 300_000 });

  test(`Installs ${testOperator.name} Operator and ${testOperand.name} Instance, tests uninstall scenarios, then successfully uninstalls`, async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const installPage = new OperatorInstallPage(page);
    const installedOperatorsPage = new InstalledOperatorsPage(page);
    const operatorDetailsPage = new OperatorDetailsPage(page);

    const testNamespace = generateTestNamespace();
    cleanup.trackNamespace(testNamespace);

    // Track the subscription that will be created
    cleanup.trackCustomResource(
      operatorPackageName,
      testNamespace,
      'operators.coreos.com',
      'v1alpha1',
      'subscriptions',
    );

    await test.step('Ensure no conflicting global subscription pre-exists', async () => {
      // AllNamespaces install in openshift-operators disables Install for all namespaces.
      try {
        await k8sClient.getCustomResource(
          'operators.coreos.com',
          'v1alpha1',
          'openshift-operators',
          'subscriptions',
          operatorPackageName,
        );
        test.skip(true, `${operatorPackageName} is globally installed; cannot install in parallel`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes('404') && !message.includes('not found')) {
          throw error;
        }
      }
    });

    await test.step('Install operator in new test namespace', async () => {
      try {
        await installPage.installOperatorInNewNamespace(
          testOperator.name,
          testOperator.operatorCardTestID,
          testNamespace,
        );
      } catch (error) {
        if (error?.message?.includes('operator-Data Grid')) {
          test.skip(true, 'Data Grid operator not available in this cluster environment');
        }
        throw error;
      }
    });

    await test.step('Verify operator installation and create operand', async () => {
      // Verify operator installation succeeded (with shorter timeout for faster feedback)
      await installedOperatorsPage.verifyOperatorInstallationSucceeded(
        testOperator.name,
        testNamespace,
      );

      // Navigate to operator details page
      await installedOperatorsPage.navigateToOperatorDetails(
        testOperator.name,
        testOperator.urlName,
        testNamespace,
      );

      // Track the operand that will be created
      cleanup.trackCustomResource(
        testOperand.exampleName,
        testNamespace,
        testOperand.group,
        testOperand.version,
        'infinispans',
      );

      // Create operand (this will navigate to the correct tab automatically)
      await operatorDetailsPage.createOperand(testOperand, false);
      await expect(page.getByTestId(testOperand.exampleName)).toBeVisible();
    });

    await test.step('Verify details page sections', async () => {
      // Navigate back to operator details page
      await installedOperatorsPage.navigateToOperatorDetails(
        testOperator.name,
        testOperator.urlName,
        testNamespace,
      );

      // Verify operator details page sections exist
      await operatorDetailsPage.verifyDetailsPageSections();
    });

    await test.step('Test uninstall with "Cannot load Operands" error', async () => {
      // Set up route interception to return error for operand list API (matching Cypress pattern)
      await page.route('**/api/olm/list-operands**', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to list operands' }),
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
      await installedOperatorsPage.navigateToOperatorDetails(
        testOperator.name,
        testOperator.urlName,
        testNamespace,
      );

      // Uninstall operator and delete the operand that was created
      await operatorDetailsPage.uninstallOperatorWithOperands(true);

      // Verify operator no longer exists
      await installedOperatorsPage.verifyOperatorNotExists(testOperator.name);
    });

    await test.step('Verify operand instance is deleted', async () => {
      await expect(async () => {
        try {
          await k8sClient.getCustomResource(
            testOperand.group,
            testOperand.version,
            testNamespace,
            'infinispans',
            testOperand.exampleName,
          );
          throw new Error('Operand still exists');
        } catch (error) {
          if (error.message?.includes('404') || error.message?.includes('not found')) {
            return; // Success - operand is deleted
          }
          throw error;
        }
      }).toPass({ timeout: 120_000, intervals: [5_000] });
    });
  });

  test.fixme('tracks missing "Error Deleting Operands" uninstall parity case', async () => {
    expect(true).toBe(true);
  });
});
