import { test, expect } from '../../fixtures';
import KubernetesClient from '../../clients/kubernetes-client';

const operatorName = '3scale API Management';

test.describe('Create namespace from install operators', { tag: ['@admin'] }, () => {
  let k8sClient: KubernetesClient;
  let nsName: string;

  test.beforeEach(async ({ k8sClient: client }) => {
    k8sClient = client;
    nsName = `test-create-ns-${Date.now()}`;
  });

  test.afterEach(async () => {
    try {
      await k8sClient.deleteCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        nsName,
        'subscriptions',
        '3scale-community-operator',
      );
    } catch {
      // Ignore if not created
    }
    try {
      const csvs = (await k8sClient.listCustomResources(
        'operators.coreos.com',
        'v1alpha1',
        nsName,
        'clusterserviceversions',
      )) as Array<{ metadata?: { name?: string } }>;
      for (const csv of csvs) {
        if (csv.metadata?.name) {
          await k8sClient.deleteCustomResource(
            'operators.coreos.com',
            'v1alpha1',
            nsName,
            'clusterserviceversions',
            csv.metadata.name,
          );
        }
      }
    } catch {
      // Ignore cleanup errors
    }
    try {
      await k8sClient.deleteNamespace(nsName);
    } catch {
      // Ignore if not created
    }
  });

  test('creates namespace from operator install page', async ({ page }) => {
    await test.step('Navigate to catalog and open operator details', async () => {
      await page.goto('/catalog/ns/default?catalogType=operator');
      await page.getByPlaceholder('Filter by keyword...').waitFor({ state: 'visible' });

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
