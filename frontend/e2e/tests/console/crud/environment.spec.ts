import { test, expect } from '../../../fixtures';
import { warmupSPA } from '../../../pages/base-page';
import { DetailsPage } from '../../../pages/details-page';
import { generateTestName } from '../../../utils/test-name';

test.describe('Interacting with the environment variable editor', { tag: ['@admin'] }, () => {
  let namespace: string;
  const workloadName = 'env-test-deploy';

  test.beforeAll(async ({ k8sClient }) => {
    const testName = generateTestName();
    namespace = `${testName}-env`;
    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);
    await k8sClient.createDeployment(namespace, {
      metadata: { name: workloadName, labels: { 'lbl-env': namespace } },
      spec: {
        replicas: 1,
        selector: { matchLabels: { app: workloadName } },
        template: {
          metadata: { labels: { app: workloadName } },
          spec: {
            containers: [
              {
                name: 'container',
                image: 'registry.access.redhat.com/ubi9/ubi-minimal:latest',
                command: ['sleep', 'infinity'],
              },
            ],
          },
        },
      },
    });
    await k8sClient.createConfigMap('my-config', namespace, {
      cmk1: 'config1',
      cmk2: 'config2',
    });
    await k8sClient.createSecret('my-secret', namespace, {
      key1: Buffer.from('supersecret').toString('base64'),
      key2: Buffer.from('topsecret').toString('base64'),
    });
  });

  test.beforeEach(async ({ page }) => {
    const dp = new DetailsPage(page);
    const deployUrl = `/k8s/ns/${namespace}/deployments/${workloadName}`;

    // Warm up the SPA to ensure k8s model discovery is complete before navigating
    await warmupSPA(page);
    await page.goto(deployUrl);
    await expect(dp.getPageHeading()).toContainText(workloadName, { timeout: 30_000 });
    await dp.selectTab('Environment');
    await expect(page.getByTestId('pairs-list-name').first()).toBeVisible({ timeout: 30_000 });
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(namespace);
  });

  test('adds and deletes an environment variable', async ({ page }) => {
    const key = 'KEY';
    const value = 'value';

    await test.step('Add variable', async () => {
      await page.getByTestId('pairs-list-name').first().clear();
      await page.getByTestId('pairs-list-name').first().fill(key);
      await page.getByTestId('pairs-list-value').first().clear();
      await page.getByTestId('pairs-list-value').first().fill(value);
      await page.getByTestId('environment-save').click();
      await expect(page.getByTestId('environment-save')).toBeEnabled({ timeout: 30_000 });
    });

    await test.step('Verify variable exists', async () => {
      await expect(page.getByTestId('pairs-list-name').first()).toHaveValue(key);
      await expect(page.getByTestId('pairs-list-value').first()).toHaveValue(value);
    });

    await test.step('Delete variable', async () => {
      await page.getByTestId('delete-button').first().click();
      await page.getByTestId('environment-save').click();
      await expect(page.getByTestId('environment-save')).toBeEnabled({ timeout: 30_000 });
    });

    await test.step('Verify variable removed', async () => {
      await expect(page.getByTestId('pairs-list-name').first()).not.toHaveValue(key);
      await expect(page.getByTestId('pairs-list-value').first()).not.toHaveValue(value);
    });
  });

  test('adds and deletes an environment variable from a config map', async ({ page }) => {
    const resourceName = 'my-config';
    const prefix = 'testcm';

    await test.step('Add variable from config map', async () => {
      await page.getByTestId('value-from-select').click();
      await page.getByTestId('console-select-search-input').locator('input').fill(resourceName);
      await page.getByTestId('console-select-item').first().click();
      await page.getByTestId('env-prefix').clear();
      await page.getByTestId('env-prefix').fill(prefix);
      await page.getByTestId('environment-save').click();
      await expect(page.getByTestId('environment-save')).toBeEnabled({ timeout: 30_000 });
    });

    await test.step('Verify config map variable exists', async () => {
      await expect(page.getByTestId(`resource-name-${resourceName}`)).toBeVisible();
      await expect(page.getByTestId('env-prefix')).toHaveValue(prefix);
    });

    await test.step('Delete config map variable', async () => {
      await page.getByTestId('pairs-list__delete-from-btn').click();
      await page.getByTestId('environment-save').click();
      await expect(page.getByTestId('environment-save')).toBeEnabled({ timeout: 30_000 });
    });

    await test.step('Verify config map variable removed', async () => {
      await expect(page.getByTestId(`resource-name-${resourceName}`)).not.toBeAttached();
      await expect(page.getByTestId('resource-name-container')).toBeVisible();
      await expect(page.getByTestId('env-prefix')).toHaveValue('');
    });
  });

  test('adds and deletes an environment variable from a secret', async ({ page }) => {
    const resourceName = 'my-secret';
    const prefix = 'testsecret';

    await test.step('Add variable from secret', async () => {
      await page.getByTestId('value-from-select').click();
      await page.getByTestId('console-select-search-input').locator('input').fill(resourceName);
      await page.getByTestId('console-select-item').first().click();
      await page.getByTestId('env-prefix').clear();
      await page.getByTestId('env-prefix').fill(prefix);
      await page.getByTestId('environment-save').click();
      await expect(page.getByTestId('environment-save')).toBeEnabled({ timeout: 30_000 });
    });

    await test.step('Verify secret variable exists', async () => {
      await expect(page.getByTestId(`resource-name-${resourceName}`)).toBeVisible();
      await expect(page.getByTestId('env-prefix')).toHaveValue(prefix);
    });

    await test.step('Delete secret variable', async () => {
      await page.getByTestId('pairs-list__delete-from-btn').click();
      await page.getByTestId('environment-save').click();
      await expect(page.getByTestId('environment-save')).toBeEnabled({ timeout: 30_000 });
    });

    await test.step('Verify secret variable removed', async () => {
      await expect(page.getByTestId(`resource-name-${resourceName}`)).not.toBeAttached();
      await expect(page.getByTestId('resource-name-container')).toBeVisible();
      await expect(page.getByTestId('env-prefix')).toHaveValue('');
    });
  });
});
