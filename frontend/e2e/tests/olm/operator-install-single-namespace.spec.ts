import { test, expect } from '../../fixtures';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';
import { OperatorDetailsPage, TestOperandProps } from '../../pages/operator-details-page';
import { generateTestNamespace } from '../../test-utils/test-namespace';

// The three describe blocks below all install/uninstall the same OLM "datagrid" package.
// A global (AllNamespaces) subscription for a package blocks any other namespace-scoped
// install of that same package cluster-wide, so these tests must never execute concurrently
// with each other. Keeping them in a single file is sufficient: Playwright runs tests within
// one file serially, in declaration order, regardless of the configured worker count.

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

test.describe(
  `Single Namespace Operator Installation - ${testOperator.name}`,
  { tag: ['@admin'] },
  () => {
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
        'subscriptions',
      );

      await test.step('Ensure no conflicting global subscription pre-exists', async () => {
        // AllNamespaces install in openshift-operators disables Install for all namespaces.
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
            `${operatorPackageName} is globally installed in ${globalNamespace}; cannot install as single-namespace in parallel`,
          );
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
          if (error.message?.includes('operator-Data Grid')) {
            test.skip(true, 'Data Grid operator not available in this cluster environment');
          }
          throw error;
        }
      });

      await test.step('Verify operator installation succeeded in test namespace', async () => {
        await installedOperatorsPage.verifyOperatorInstallationSucceeded(
          testOperator.name,
          testNamespace,
        );
      });

      await test.step('Navigate to operator details page and verify sections', async () => {
        await installedOperatorsPage.navigateToOperatorDetails(
          testOperator.name,
          testOperator.urlName,
          testNamespace,
        );
        await operatorDetailsPage.verifyDetailsPageSections();
      });

      await test.step('Verify operator is NOT installed globally (isolation test)', async () => {
        // This is a key verification that distinguishes single namespace from global installation
        await installedOperatorsPage.navigateToInstalledOperators();

        // Switch to global namespace and verify this specific operator is not there
        await installedOperatorsPage.verifyOperatorNotInstalledInNamespace(
          testOperator.name,
          globalNamespace,
        );
      });

      await test.step('Navigate to operator details', async () => {
        await installedOperatorsPage.navigateToInstalledOperators();
        await installedOperatorsPage.selectNamespace(testNamespace);

        // Wait for loading to complete after namespace switch
        await expect(page.locator('.loading-skeleton--table')).not.toBeAttached({
          timeout: 30_000,
        });

        // Wait for operator to appear in the new namespace
        await expect(installedOperatorsPage.getOperatorRow(testOperator.name)).toBeVisible({
          timeout: 60_000,
        });

        await installedOperatorsPage.navigateToOperatorDetails(
          testOperator.name,
          testOperator.urlName,
          testNamespace,
        );
        await operatorDetailsPage.verifyDetailsPageSections();
      });

      await test.step('Create operand', async () => {
        // Track the operand that will be created
        cleanup.trackCustomResource(
          testOperand.exampleName,
          testNamespace,
          testOperand.group,
          testOperand.version,
          'infinispans',
        );

        await operatorDetailsPage.createOperand(testOperand, false);
        await expect(page.getByTestId(testOperand.exampleName)).toBeVisible();
      });

      await test.step('Navigate to operand details', async () => {
        await operatorDetailsPage.clickOperandLink(testOperand.exampleName);
        await expect(page).toHaveURL((url) => url.pathname.endsWith(`/${testOperand.exampleName}`));
      });

      await test.step('Delete operand instance', async () => {
        await operatorDetailsPage.deleteOperand(testOperand, false);
      });

      await test.step('Navigate back to operand instances and verify deletion', async () => {
        await installedOperatorsPage.navigateToOperatorDetails(
          testOperator.name,
          testOperator.urlName,
          testNamespace,
        );
        await operatorDetailsPage.navigateToOperandTab(testOperand.name, false);
        await operatorDetailsPage.verifyOperandNotExistsOnCurrentTab(testOperand.exampleName);
      });

      await test.step('Uninstall operator from namespace', async () => {
        await operatorDetailsPage.uninstallOperator();
        await installedOperatorsPage.verifyOperatorNotExists(testOperator.name);
      });
    });
  },
);

test.describe(
  `Globally installing "${testOperator.name}" operator in ${globalNamespace}`,
  { tag: ['@admin'] },
  () => {
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
          await installPage.installOperatorGlobally(
            testOperator.name,
            testOperator.operatorCardTestID,
          );
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
        await installedOperatorsPage.navigateToOperatorDetails(
          testOperator.name,
          testOperator.urlName,
          globalNamespace,
        );
        await operatorDetailsPage.verifyDetailsPageSections();
      });

      await test.step('Create operand instance', async () => {
        // Track the operand that will be created
        cleanup.trackCustomResource(
          testOperand.exampleName,
          globalNamespace,
          testOperand.group,
          testOperand.version,
          'infinispans',
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
  },
);

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
          globalNamespace,
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
      // Set up route interception to return an error for the operand list API.
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
