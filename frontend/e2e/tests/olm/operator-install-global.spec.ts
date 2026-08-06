import { test, expect } from '../../fixtures';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';
import { OperatorDetailsPage, TestOperandProps } from '../../pages/operator-details-page';
import { cleanupOperatorResources, cleanupAllOperatorsByPackageName, forceCleanupAllOperatorsByPackageName, deleteStuckDatagridOperator } from '../../test-utils/operator-cleanup';

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
    console.log('\n🧹 ========= BEFORE EACH: Starting cleanup =========');

    try {
      // Run the normal cleanup procedures (they have built-in quick checks now)
      console.log('⏳ Running cleanupAllOperatorsByPackageName...');
      await cleanupAllOperatorsByPackageName(k8sClient, operatorPackageName);
      console.log('✅ cleanupAllOperatorsByPackageName complete');

      console.log('⏳ Running forceCleanupAllOperatorsByPackageName...');
      await forceCleanupAllOperatorsByPackageName(k8sClient, operatorPackageName);
      console.log('✅ forceCleanupAllOperatorsByPackageName complete');

      console.log('⏳ Running deleteStuckDatagridOperator...');
      await deleteStuckDatagridOperator(k8sClient);
      console.log('✅ deleteStuckDatagridOperator complete');

      // Clean up any remaining resources in the global namespace specifically
      console.log('⏳ Running namespace-specific cleanup...');
      await cleanupOperatorResources(k8sClient, {
        operatorPackageName,
        operandPlural: 'infinispans',
        testOperand,
        namespace: globalNamespace,
      });
      console.log('✅ namespace-specific cleanup complete');

    } catch (error) {
      console.log(`❌ Cleanup error: ${error.message}`);
      throw error;
    }

    console.log('🎉 ========= BEFORE EACH: ALL CLEANUP COMPLETE =========\n');
  });

  test.afterEach(async ({ k8sClient }) => {
    console.log('\n🧽 ========= AFTER EACH: Verifying UI uninstall =========');

    try {
      // Give UI uninstall substantial time to complete naturally
      console.log('⏳ Waiting 15 seconds for UI uninstall to complete naturally...');
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Check if UI uninstall actually completed successfully
      console.log('🔍 Checking if UI uninstall completed...');
      let uiUninstallSucceeded = false;

      try {
        const operators = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
        const remainingOperators = operators.filter((op: any) =>
          op.metadata.name?.includes(operatorPackageName) ||
          op.metadata.name?.includes('datagrid') ||
          op.metadata.name === 'datagrid.openshift-operators'
        );

        const subscriptions = await k8sClient.listCustomResources('operators.coreos.com', 'v1alpha1', globalNamespace, 'subscriptions');
        const remainingSubscriptions = subscriptions.filter((sub: any) =>
          sub.metadata.name?.includes(operatorPackageName) ||
          sub.metadata.name?.includes('datagrid')
        );

        if (remainingOperators.length === 0 && remainingSubscriptions.length === 0) {
          console.log('✅ UI uninstall completed successfully - no cleanup needed');
          uiUninstallSucceeded = true;
        } else {
          console.log(`⚠️ UI uninstall incomplete: ${remainingOperators.length} operators, ${remainingSubscriptions.length} subscriptions still exist`);
        }
      } catch (error) {
        console.log(`Error checking UI uninstall status: ${error.message}`);
      }

      // Only run cleanup if UI uninstall failed or left resources behind
      if (!uiUninstallSucceeded) {
        console.log('🧽 UI uninstall incomplete - running safety cleanup...');

        console.log('⏳ Running safety cleanupAllOperatorsByPackageName...');
        await cleanupAllOperatorsByPackageName(k8sClient, operatorPackageName);

        console.log('⏳ Running safety forceCleanupAllOperatorsByPackageName...');
        await forceCleanupAllOperatorsByPackageName(k8sClient, operatorPackageName);

        console.log('⏳ Running safety deleteStuckDatagridOperator...');
        await deleteStuckDatagridOperator(k8sClient);

        console.log('⏳ Running safety namespace-specific cleanup...');
        await cleanupOperatorResources(k8sClient, {
          operatorPackageName,
          operandPlural: 'infinispans',
          testOperand,
          namespace: globalNamespace,
        });

        console.log('✅ Safety cleanup complete');
      }

    } catch (error) {
      console.log(`❌ Safety cleanup error: ${error.message}`);
      // Don't throw here - we don't want afterEach to fail the test
    }

    console.log('🎉 ========= AFTER EACH: COMPLETE =========\n');
  });

  test(`Globally installs ${testOperator.name} operator in ${globalNamespace} and creates ${testOperand.name} operand`, async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    console.log('\n🚀 ========= TEST EXECUTION STARTING =========\n');

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
