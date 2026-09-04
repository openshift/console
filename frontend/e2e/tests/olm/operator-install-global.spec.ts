import { test, expect } from '../../fixtures';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';
import { OperatorDetailsPage, TestOperandProps } from '../../pages/operator-details-page';

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

  test(`Globally installs ${testOperator.name} operator in ${globalNamespace} and creates ${testOperand.name} operand`, async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const installPage = new OperatorInstallPage(page);
    const installedOperatorsPage = new InstalledOperatorsPage(page);
    const operatorDetailsPage = new OperatorDetailsPage(page);
    const clusterOperatorName = `${operatorPackageName}.${globalNamespace}`;

    await test.step('Ensure the global subscription does not pre-exist', async () => {
      try {
        await k8sClient.getCustomResource(
          'operators.coreos.com',
          'v1alpha1',
          globalNamespace,
          'subscriptions',
          operatorPackageName,
        );
        test.skip(
          true,
          `${operatorPackageName} subscription already exists in ${globalNamespace}; cannot safely claim ownership for cleanup`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes('404') && !message.includes('not found')) {
          throw error;
        }
      }

      try {
        await k8sClient.getClusterCustomResource(
          'operators.coreos.com',
          'v1',
          'operators',
          clusterOperatorName,
        );
        test.skip(
          true,
          `${clusterOperatorName} already exists; cannot safely claim ownership for cleanup`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes('404') && !message.includes('not found')) {
          throw error;
        }
      }
    });

    cleanup.trackCustomResource(
      operatorPackageName,
      globalNamespace,
      'operators.coreos.com',
      'v1alpha1',
      'subscriptions',
    );
    cleanup.trackClusterCustomResource(
      clusterOperatorName,
      'operators.coreos.com',
      'v1',
      'operators',
    );

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

      const subscription = (await k8sClient.getCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        globalNamespace,
        'subscriptions',
        operatorPackageName,
      )) as {
        status?: { installPlanRef?: { name?: string }; installedCSV?: string };
      };

      const installPlanName = subscription.status?.installPlanRef?.name;
      const installedCsvName = subscription.status?.installedCSV;
      if (!installPlanName) {
        throw new Error(`InstallPlan ref not found for ${operatorPackageName} subscription`);
      }
      if (!installedCsvName) {
        throw new Error(`Installed CSV not found for ${operatorPackageName} subscription`);
      }

      cleanup.trackCustomResource(
        installPlanName,
        globalNamespace,
        'operators.coreos.com',
        'v1alpha1',
        'installplans',
      );
      cleanup.trackCustomResource(
        installedCsvName,
        globalNamespace,
        'operators.coreos.com',
        'v1alpha1',
        'clusterserviceversions',
      );
    });

    await test.step('Navigate to operator details page and verify sections', async () => {
      await installedOperatorsPage.navigateToOperatorDetails(testOperator.name, testOperator.urlName, globalNamespace);
      await operatorDetailsPage.verifyDetailsPageSections();
    });

    await test.step('Create operand instance', async () => {
      // Track the operand that will be created
      cleanup.trackCustomResource(
        testOperand.exampleName,
        globalNamespace,
        testOperand.group,
        testOperand.version,
        'infinispans'
      );

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
