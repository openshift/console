import { test, expect } from '../../fixtures';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';
import { OperatorDetailsPage, TestOperandProps } from '../../pages/operator-details-page';
import { cleanupOperatorResources, cleanupAllOperatorsByPackageName } from '../../test-utils/operator-cleanup';

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
const globalNamespace = 'openshift-operators';

// Enhanced cleanup wrapper for Data Grid operator
async function cleanupDataGridOperatorResources(k8sClient: any) {
  await cleanupOperatorResources(k8sClient, {
    operatorPackageName,
    operandPlural: 'infinispans',
    testOperand,
    namespace: globalNamespace,
  });
}


test.describe(`Globally installing "${testOperator.name}" operator in ${globalNamespace}`, { tag: ['@admin'] }, () => {
  test.beforeEach(async ({ k8sClient, page }) => {
    console.log('=== BEFORE EACH: Starting cleanup ===');

    // First clean up cluster-scoped Operator resources that prevent reinstallation
    try {
      const operators = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
      const dataGridOperators = operators.filter((op: any) => op.metadata.name.includes(operatorPackageName));

      for (const operator of dataGridOperators) {
        console.log(`Deleting cluster operator: ${operator.metadata.name}`);
        await k8sClient.deleteClusterCustomResource('operators.coreos.com', 'v1', 'operators', operator.metadata.name);
      }
    } catch (error) {
      console.log('Error cleaning up cluster operators:', error.message);
    }

    // Then do aggressive cluster-wide cleanup of all operators for this package
    await cleanupAllOperatorsByPackageName(k8sClient, operatorPackageName);

    // Then do namespace-specific cleanup
    await cleanupDataGridOperatorResources(k8sClient);

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
            operandPlural: 'infinispans',
            namespace: nsName,
          });
        }
      }
    } catch (error) {
      console.log('Error cleaning up test namespaces:', error.message);
    }

    // Wait for cleanup to propagate
    await page.waitForTimeout(5000); // Reduced from 15s to 5s
    console.log('=== BEFORE EACH: Cleanup complete ===');
  });

  test.afterEach(async ({ k8sClient }) => {
    console.log('=== AFTER EACH: Safety cleanup (UI uninstall should have handled this) ===');

    // Give UI uninstall time to complete first
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Clean up cluster-scoped Operator resources first
    try {
      const operators = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
      const dataGridOperators = operators.filter((op: any) => op.metadata.name.includes(operatorPackageName));

      for (const operator of dataGridOperators) {
        console.log(`[AfterEach] Deleting cluster operator: ${operator.metadata.name}`);
        await k8sClient.deleteClusterCustomResource('operators.coreos.com', 'v1', 'operators', operator.metadata.name);
      }
    } catch (error) {
      console.log('Error in afterEach cluster operator cleanup:', error.message);
    }

    // Only clean up if UI uninstall failed to remove everything
    await cleanupAllOperatorsByPackageName(k8sClient, operatorPackageName);

    console.log('=== AFTER EACH: Safety cleanup complete ===');
  });

  test(`Globally installs ${testOperator.name} operator in ${globalNamespace} and creates ${testOperand.name} operand`, async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const installPage = new OperatorInstallPage(page);
    const installedOperatorsPage = new InstalledOperatorsPage(page);
    const operatorDetailsPage = new OperatorDetailsPage(page);

    await test.step('Install operator globally', async () => {
      try {
        await installPage.installOperatorGlobally(testOperator.name, testOperator.operatorCardTestID);
      } catch (error) {
        if (error.message?.includes('operator-Data Grid')) {
          test.skip(true, 'Data Grid operator not available in this cluster environment');
        }
        throw error;
      }
    });

    await test.step('Verify operator installation succeeded', async () => {
      await installedOperatorsPage.verifyOperatorInstallationSucceeded(testOperator.name);
    });

    await test.step('Navigate to operator details page and verify sections', async () => {
      await installedOperatorsPage.navigateToOperatorDetails(testOperator.name, testOperator.urlName, globalNamespace);
      await operatorDetailsPage.verifyDetailsPageSections();
    });

    await test.step('Create operand instance', async () => {
      await operatorDetailsPage.createOperand(testOperand, true);
      await expect(page.getByTestId(testOperand.exampleName)).toBeVisible();
    });

    await test.step('Verify operand exists and can navigate to details', async () => {
      await operatorDetailsPage.verifyOperandExists(testOperand, true);
    });

    await test.step('Delete operand instance', async () => {
      await operatorDetailsPage.deleteOperand(testOperand, true);
      await operatorDetailsPage.verifyOperandNotExists(testOperand, true);
    });

    await test.step('Uninstall operator', async () => {
      await operatorDetailsPage.uninstallOperator();
      await installedOperatorsPage.verifyOperatorNotExists(testOperator.name);
    });
  });
});
