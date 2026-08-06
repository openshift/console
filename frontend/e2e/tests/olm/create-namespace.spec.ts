import { test, expect } from '../../fixtures';
import KubernetesClient from '../../clients/kubernetes-client';
import { cleanupOperatorResources, cleanupAllOperatorsByPackageName } from '../../test-utils/operator-cleanup';
import { generateTestNamespace } from '../../test-utils/test-namespace';

const operatorName = '3scale API Management';
const operatorPackageName = '3scale-community-operator';

test.describe('Create namespace from install operators', { tag: ['@admin'] }, () => {
  let k8sClient: KubernetesClient;
  let nsName: string;

  test.beforeEach(async ({ k8sClient: client, page }) => {
    console.log('=== CREATE NAMESPACE BEFORE EACH: Starting cleanup ===');

    k8sClient = client;
    nsName = generateTestNamespace();

    // Do aggressive cluster-wide cleanup for 3scale operators
    await cleanupAllOperatorsByPackageName(k8sClient, operatorPackageName);

    // Clean up any test namespaces from previous runs
    try {
      const namespaces = await k8sClient.listNamespaces();
      const testNamespaces = namespaces.filter((ns: any) => ns.metadata.name.startsWith('test-'));

      for (const testNs of testNamespaces) {
        const nsName = (testNs as any)?.metadata?.name;
        if (nsName) {
          console.log(`Cleaning up test namespace: ${nsName}`);
          await cleanupOperatorResources(k8sClient, {
            operatorPackageName,
            namespace: nsName,
          });
          // Also delete the namespace itself
          try {
            await k8sClient.deleteNamespace(nsName);
          } catch (error) {
            console.log(`Failed to delete namespace ${nsName}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.log('Error cleaning up test namespaces:', error.message);
    }

    // Wait for cleanup to propagate
    await page.waitForTimeout(10000);
    console.log('=== CREATE NAMESPACE BEFORE EACH: Cleanup complete ===');
  });

  test.afterEach(async () => {
    console.log('=== CREATE NAMESPACE AFTER EACH: Starting cleanup ===');

    // Use our comprehensive cleanup for the test namespace
    await cleanupOperatorResources(k8sClient, {
      operatorPackageName,
      namespace: nsName,
    });

    // Also do cluster-wide cleanup
    await cleanupAllOperatorsByPackageName(k8sClient, operatorPackageName);

    // Delete the test namespace
    try {
      await k8sClient.deleteNamespace(nsName);
      console.log(`✅ Deleted test namespace: ${nsName}`);
    } catch (error) {
      console.log(`❌ Failed to delete namespace ${nsName}:`, error.message);
    }

    console.log('=== CREATE NAMESPACE AFTER EACH: Cleanup complete ===');
  });

  test('creates namespace from operator install page', async ({ page }) => {
    // OLMv1 is enabled by default on techPreview clusters, replacing the OLMv0
    // OperatorHub catalog with an empty Software Catalog. Skip instead of timing out.
    await page.goto('/');
    const isTechPreview = await page.evaluate(() => window.SERVER_FLAGS.techPreview);
    test.skip(isTechPreview, 'OLMv1 is active on techPreview clusters — OLMv0 OperatorHub catalog is unavailable');

    await test.step('Navigate to catalog and open operator details', async () => {
      await page.goto('/catalog/ns/default?catalogType=operator');
      await page.getByPlaceholder('Filter by keyword...').fill(operatorName);
      await page.getByTestId(`operator-${operatorName}`).click();
    });

    await test.step('Click Install in operator details modal', async () => {
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const installLink = dialog.getByRole('button', { name: 'Install' });
      await expect(installLink).toBeVisible();
      await installLink.click();
    });

    await test.step('Select single namespace installation mode', async () => {
      await expect(page.getByRole('heading', { name: 'Install Operator' })).toBeVisible();
      const radio = page.getByTestId('A specific namespace on the cluster-radio-input');
      await expect(radio).toBeVisible();
      await radio.click();
    });

    await test.step('Create a new namespace from the dropdown', async () => {
      await page.getByTestId('dropdown-selectbox').click();
      await page.locator('[data-test-dropdown-menu^="Create_"]').click();

      await expect(page.getByTestId('input-name')).toBeVisible();
      await page.getByTestId('input-name').fill(nsName);
      await page.getByTestId('confirm-action').click();

      await expect(page.getByRole('dialog')).toBeHidden();
    });

    await test.step('Verify the dropdown shows the new namespace', async () => {
      await expect(page.getByTestId('dropdown-selectbox')).toContainText(nsName);
    });

    await test.step('Install the operator and verify success', async () => {
      await page.getByTestId('install-operator').click();

      const successButton = page.getByTestId('view-installed-operators-btn');
      await expect(successButton).toContainText(`View installed Operators in Namespace ${nsName}`, {
        timeout: 60000,
      });
    });
  });
});
