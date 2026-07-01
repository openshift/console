import { test, expect } from '../../../fixtures';
import { ModalPage } from '../../../pages/modal-page';
import { getVACFixtures, isAwsPlatform } from '../../../mocks/storage';

test.describe('VolumeAttributesClass E2E tests', { tag: ['@admin', '@storage'] }, () => {
  test('creates PVC with VAC, modifies VAC, and handles invalid VAC', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    test.skip(!(await isAwsPlatform(k8sClient)), 'Requires AWS platform with EBS CSI driver');
    const ns = `test-vac-${Date.now()}`;
    const fixtures = getVACFixtures(ns);
    const {
      VAC_LOW_IOPS,
      VAC_HIGH_IOPS,
      VAC_INVALID,
      STORAGE_CLASS,
      TEST_VAC_LOW_IOPS,
      TEST_VAC_HIGH_IOPS,
      TEST_VAC_INVALID,
      TEST_PVC,
      TEST_STORAGECLASS,
      getDeployment,
    } = fixtures;
    const modal = new ModalPage(page);

    await test.step('Set up namespace and cluster-scoped resources', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createClusterCustomResource(
        'storage.k8s.io',
        'v1',
        'storageclasses',
        STORAGE_CLASS as any,
      );
      await k8sClient.createClusterCustomResource(
        'storage.k8s.io',
        'v1',
        'volumeattributesclasses',
        VAC_LOW_IOPS as any,
      );
      await k8sClient.createClusterCustomResource(
        'storage.k8s.io',
        'v1',
        'volumeattributesclasses',
        VAC_HIGH_IOPS as any,
      );
      await k8sClient.createClusterCustomResource(
        'storage.k8s.io',
        'v1',
        'volumeattributesclasses',
        VAC_INVALID as any,
      );
      await k8sClient.createDeployment(ns, getDeployment(ns, TEST_PVC) as any);
    });

    await test.step('Create PVC with VolumeAttributesClass', async () => {
      await page.goto(`/k8s/ns/${ns}/persistentvolumeclaims/~new/form`);
      await page.getByTestId('pvc-name').fill(TEST_PVC);
      await page.getByTestId('pvc-size').fill('1');

      await page.getByTestId('storageclass-dropdown').click();
      await page.getByRole('option', { name: TEST_STORAGECLASS }).click();

      await page.getByTestId('volumeattributesclass-dropdown').click();
      await page.getByRole('option', { name: TEST_VAC_LOW_IOPS }).click();

      await page.getByTestId('create-pvc').click();
    });

    await test.step('Verify PVC details with requested VAC', async () => {
      await expect(page.getByTestId('page-heading')).toContainText(TEST_PVC);
      await expect(page.getByTestId('pvc-requested-vac')).toContainText(
        TEST_VAC_LOW_IOPS,
        { timeout: 30_000 },
      );
      await expect(
        page.getByTestId('pvc-status').locator('[data-test="status-text"]'),
      ).toContainText('Bound', {
        timeout: 120_000,
      });
      await expect(page.getByTestId('pvc-current-vac')).toContainText(
        TEST_VAC_LOW_IOPS,
        { timeout: 30_000 },
      );
    });

    await test.step('Modify VolumeAttributesClass to high IOPS', async () => {
      await page.getByTestId('actions-menu-button').click();
      await page.getByTestId('Modify VolumeAttributesClass').click();
      await modal.waitForOpen();

      await page.getByTestId('modify-vac-dropdown').click();
      await page.getByRole('option', { name: TEST_VAC_HIGH_IOPS }).click();
      await modal.submit();
      await modal.waitForClosed();

      await expect(page.getByTestId('pvc-requested-vac')).toContainText(
        TEST_VAC_HIGH_IOPS,
        { timeout: 30_000 },
      );
      await expect(page.getByTestId('pvc-current-vac')).toContainText(
        TEST_VAC_HIGH_IOPS,
        { timeout: 30_000 },
      );
    });

    await test.step('Attempt invalid VAC modification and verify error', async () => {
      await page.getByTestId('actions-menu-button').click();
      await page.getByTestId('Modify VolumeAttributesClass').click();
      await modal.waitForOpen();

      await page.getByTestId('modify-vac-dropdown').click();
      await page.getByRole('option', { name: TEST_VAC_INVALID }).click();
      await modal.submit();
      await modal.waitForClosed();

      await expect(page.getByTestId('pvc-requested-vac')).toContainText(
        TEST_VAC_INVALID,
        { timeout: 30_000 },
      );
      await expect(page.getByTestId('pvc-current-vac')).toContainText(
        TEST_VAC_HIGH_IOPS,
        { timeout: 30_000 },
      );

      await expect(page.getByTestId('vac-error-alert')).toBeVisible({
        timeout: 60_000,
      });
      await expect(page.getByTestId('vac-error-alert')).toContainText(
        'VolumeAttributesClass modification failed',
      );
    });

    await test.step('Clean up cluster-scoped resources', async () => {
      for (const vacName of [TEST_VAC_LOW_IOPS, TEST_VAC_HIGH_IOPS, TEST_VAC_INVALID]) {
        await k8sClient
          .patchClusterCustomResource('storage.k8s.io', 'v1', 'volumeattributesclasses', vacName, {
            metadata: { finalizers: [] },
          })
          .catch(() => {});
      }
      for (const vacName of [TEST_VAC_LOW_IOPS, TEST_VAC_HIGH_IOPS, TEST_VAC_INVALID]) {
        await k8sClient
          .deleteClusterCustomResource('storage.k8s.io', 'v1', 'volumeattributesclasses', vacName)
          .catch(() => {});
      }
      await k8sClient
        .deleteClusterCustomResource('storage.k8s.io', 'v1', 'storageclasses', TEST_STORAGECLASS)
        .catch(() => {});
    });
  });
});
