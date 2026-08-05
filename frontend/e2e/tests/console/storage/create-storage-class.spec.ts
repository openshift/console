import kebabCase from 'lodash/kebabCase.js';
import { test, expect } from '../../../fixtures';
import { ListPage } from '../../../pages/list-page';
import { ModalPage } from '../../../pages/modal-page';
import { provisionersMap, type Parameter } from '../../../mocks/storage';

function getSCNameFromProvisioner(provisionerName: string): string {
  return `${kebabCase(provisionerName)}-sc`;
}

function getParameterTestId(name: string): string {
  return `storage-class-provisioner-${kebabCase(name)}`;
}

function getParameterType(parameter: Parameter): 'dropdown' | 'checkbox' | 'text' {
  if (Array.isArray(parameter.values)) return 'dropdown';
  if (typeof parameter.values === 'string') return 'text';
  return 'checkbox';
}

test.describe(
  'Storage Class creation with various provisioners',
  { tag: ['@admin', '@storage'] },
  () => {
    for (const [provisionerName, parameters] of Object.entries(provisionersMap)) {
      test(`creates ${provisionerName} based storage class`, async ({ page, k8sClient }) => {
        const listPage = new ListPage(page);
        const modal = new ModalPage(page);
        const scName = getSCNameFromProvisioner(provisionerName);

        await test.step('Clean up leftover StorageClass if exists', async () => {
          await k8sClient
            .deleteClusterCustomResource('storage.k8s.io', 'v1', 'storageclasses', scName)
            .catch(() => {});
        });

        await test.step('Navigate to StorageClasses and click Create', async () => {
          await page.goto('/k8s/cluster/storageclasses');
          await listPage.clickCreateButton();
        });

        await test.step('Fill storage class information', async () => {
          await page.getByTestId('storage-class-name').fill(scName);
          await page
            .getByTestId('storage-class-description')
            .fill('Storage class to be used for E2E tests only.');
          await page.getByTestId('storage-class-provisioner-dropdown').click();
          await page.getByTestId('console-select-search-input').locator('input').fill(provisionerName);
          await page.getByRole('option', { name: provisionerName }).click();
        });

        await test.step('Validate and fill provisioner parameters', async () => {
          for (const parameter of parameters) {
            await fillParameter(page, parameter);
          }
        });

        await test.step('Create storage class and verify details page', async () => {
          await page.locator('#save-changes').click();
          await expect(page.getByTestId('resource-title')).toBeVisible({
            timeout: 30_000,
          });
          await expect(page.getByTestId('resource-title')).not.toBeEmpty();
        });

        await test.step('Delete storage class via UI', async () => {
          await page.getByTestId('actions-menu-button').click();
          await page.getByTestId('Delete StorageClass').click();
          await modal.waitForOpen();
          await modal.submit();
          await modal.waitForClosed();
        });
      });
    }
  },
);

async function fillParameter(page: import('@playwright/test').Page, parameter: Parameter): Promise<void> {
  const testId = getParameterTestId(parameter.name);
  const paramType = getParameterType(parameter);

  if (paramType === 'dropdown') {
    await page.getByTestId(testId).click();
    const values = parameter.values as string[];
    for (const val of values) {
      await expect(page.getByRole('option', { name: val, exact: true })).toBeVisible();
    }
    await page.getByRole('option', { name: values[0], exact: true }).click();
  } else if (paramType === 'checkbox') {
    await page.getByTestId(testId).click();
  } else {
    await page.getByTestId(testId).fill(parameter.values as string);
  }

  if (parameter.hintText) {
    await expect(page.locator('.help-block', { hasText: parameter.hintText })).toBeVisible();
  }

  if (parameter.nestedParameter) {
    await fillParameter(page, parameter.nestedParameter);
  }
}
