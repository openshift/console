import { test, expect } from '../../fixtures';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';
import { OperatorDetailsPage, TestOperandProps } from '../../pages/operator-details-page';
import { operatorTestCleanup } from '../../test-utils/operator-cleanup';

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


test.describe(`Globally installing "${testOperator.name}" operator in ${globalNamespace}`, { tag: ['@admin'] }, () => {
  test.beforeEach(async ({ k8sClient, page }) => {
    console.log('\n🧹 ========= BEFORE EACH: Starting cleanup =========');

    const cleanupSuccess = await operatorTestCleanup(k8sClient, {
      operatorPackageName,
      operandPlural: 'infinispans',
      testOperand,
      targetNamespace: globalNamespace,
      crdPatterns: ['.infinispan.org'], // Clean up Data Grid CRDs
    });

    if (!cleanupSuccess) {
      throw new Error('Cleanup failed to establish clean state');
    }

    console.log('🎉 ========= BEFORE EACH: ALL CLEANUP COMPLETE =========\n');
  });

  test.afterEach(async ({ k8sClient }) => {
    console.log('\n🧽 ========= AFTER EACH: Verifying UI uninstall =========');

    try {
      await operatorTestCleanup(k8sClient, {
        operatorPackageName,
        operandPlural: 'infinispans',
        testOperand,
        targetNamespace: globalNamespace,
        crdPatterns: ['.infinispan.org'], // Clean up Data Grid CRDs
        waitForUiUninstall: true, // Give UI uninstall a moment to start
        uiUninstallTimeoutMs: 10_000, // Brief delay before cleanup
      });
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
