import { test, expect } from '../../fixtures';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';
import { OperatorDetailsPage, TestOperandProps } from '../../pages/operator-details-page';
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

test.describe(`Single Namespace Operator Installation - ${testOperator.name}`, { tag: ['@admin'] }, () => {
  test.describe.configure({ timeout: 300_000 });

  test(`Installs ${testOperator.name} operator in test namespace and manages ${testOperand.name} operand instance`, async ({
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
      'subscriptions'
    );

    await test.step('Install operator in new test namespace', async () => {
      try {
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
      // Track the operand that will be created
      cleanup.trackCustomResource(
        testOperand.exampleName,
        testNamespace,
        testOperand.group,
        testOperand.version,
        'infinispans'
      );

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
