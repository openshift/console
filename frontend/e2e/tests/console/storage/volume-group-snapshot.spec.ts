import { test, expect } from '../../../fixtures';
import { ListPage } from '../../../pages/list-page';
import { ModalPage } from '../../../pages/modal-page';
import { findGroupSnapshotCapableStorageClass, getVGSFixtures } from '../../../mocks/storage';

const VALIDATION_ERROR =
  'Selected PVCs have different storage provisioners. All PVCs must have StorageClasses with the same provisioner.';

test.describe('VolumeGroupSnapshot Tests', { tag: ['@admin', '@storage'] }, () => {
  test('creates, lists, and deletes a VolumeGroupSnapshot from a label selector', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    // Group-snapshot support depends on a CSI driver/snapshot-controller with the
    // CSIVolumeGroupSnapshot feature gate enabled, which isn't implied by the CRDs being
    // installed or by any particular platform. Discover a StorageClass/VolumeGroupSnapshotClass
    // pairing the cluster has actually been configured with, and skip otherwise.
    const capable = await findGroupSnapshotCapableStorageClass(k8sClient);
    test.skip(
      !capable,
      'No StorageClass with a provisioner matching an existing VolumeGroupSnapshotClass was found',
    );
    const { storageClassName, vgsClassName } = capable!;

    const ns = `test-vgs-${Date.now()}`;
    const fixtures = getVGSFixtures(`${Date.now()}`, storageClassName);
    const {
      TEST_PVC_A,
      TEST_PVC_B,
      PVC_SAME_PROVISIONER_A,
      PVC_SAME_PROVISIONER_B,
      getDeployment,
    } = fixtures;
    const vgsName = 'vgs-group-snapshot';
    const listPage = new ListPage(page);
    const modal = new ModalPage(page);

    await test.step('Set up namespace and PVCs', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createPVC(ns, {
        ...PVC_SAME_PROVISIONER_A,
        metadata: { ...PVC_SAME_PROVISIONER_A.metadata, namespace: ns },
      } as any);
      await k8sClient.createPVC(ns, {
        ...PVC_SAME_PROVISIONER_B,
        metadata: { ...PVC_SAME_PROVISIONER_B.metadata, namespace: ns },
      } as any);
      await k8sClient.createDeployment(ns, getDeployment(ns, [TEST_PVC_A, TEST_PVC_B]) as any);
    });

    await test.step('Wait for both PVCs to be Bound', async () => {
      for (const pvcName of [TEST_PVC_A, TEST_PVC_B]) {
        await page.goto(`/k8s/ns/${ns}/persistentvolumeclaims`);
        await listPage.waitForRows();
        await listPage.filterByName(pvcName);
        const pvcRow = listPage.getCell(pvcName).locator('xpath=ancestor::tr');
        await expect(pvcRow.locator('[data-test="status-text"]')).toContainText('Bound', {
          timeout: 120_000,
        });
      }
    });

    await test.step('Create VolumeGroupSnapshot from a label selector', async () => {
      await page.goto(`/k8s/ns/${ns}/groupsnapshot.storage.k8s.io~v1~VolumeGroupSnapshot`);
      await listPage.clickCreateButton();
      await page.getByTestId('snapshot-name').fill(vgsName);
      await page.getByTestId('tags-input').fill('vgs-test=true');
      await page.getByTestId('tags-input').press('Enter');
      await page.getByTestId('snapshot-class-dropdown').click();
      await page.getByRole('option', { name: vgsClassName }).click();
      await page.locator('#save-changes').click();
    });

    await test.step('Verify VolumeGroupSnapshot details show the source PVCs', async () => {
      await expect(page).toHaveURL(
        new RegExp(`groupsnapshot.storage.k8s.io~v1~VolumeGroupSnapshot/${vgsName}`),
      );
      await expect(page.getByTestId('page-heading')).toContainText(vgsName);
      await expect(
        page.getByTestId('resource-summary').locator('[data-test="status-text"]'),
      ).toContainText('Ready', { timeout: 120_000 });
      await expect(page.getByTestId(TEST_PVC_A)).toBeVisible();
      await expect(page.getByTestId(TEST_PVC_B)).toBeVisible();
    });

    await test.step('Verify VolumeGroupSnapshot in list', async () => {
      await page.goto(`/k8s/ns/${ns}/groupsnapshot.storage.k8s.io~v1~VolumeGroupSnapshot`);
      await listPage.waitForRows();
      await expect(listPage.getCell(vgsName)).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Delete VolumeGroupSnapshot', async () => {
      await listPage.clickKebabAction(vgsName, 'Delete VolumeGroupSnapshot');
      await modal.waitForOpen();
      await expect(modal.getSubmitButton()).toBeEnabled({ timeout: 10_000 });
      await modal.submit();
      await modal.waitForClosed();
      await expect(listPage.getCell(vgsName)).not.toBeAttached({ timeout: 90_000 });
    });
  });

  test('blocks VolumeGroupSnapshot creation when matched PVCs have different provisioners', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `test-vgs-mixed-${Date.now()}`;
    // This test only needs PVCs that declare different provisioners; it never creates a
    // VolumeGroupSnapshot, so it doesn't depend on any real StorageClass/platform - both
    // PVCs use throwaway StorageClasses with distinct fake provisioners.
    const fixtures = getVGSFixtures(`${Date.now()}`, 'unused');
    const {
      PVC_MIXED_FAKE_PROVISIONER_A,
      PVC_MIXED_FAKE_PROVISIONER_B,
      FAKE_STORAGE_CLASS_A,
      FAKE_STORAGE_CLASS_B,
    } = fixtures;

    await test.step('Set up namespace and mismatched-provisioner PVCs', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      for (const fakeStorageClass of [FAKE_STORAGE_CLASS_A, FAKE_STORAGE_CLASS_B]) {
        await k8sClient.createClusterCustomResource(
          'storage.k8s.io',
          'v1',
          'storageclasses',
          fakeStorageClass as any,
        );
        cleanup.trackClusterCustomResource(
          fakeStorageClass.metadata.name,
          'storage.k8s.io',
          'v1',
          'storageclasses',
        );
      }
      await k8sClient.createPVC(ns, {
        ...PVC_MIXED_FAKE_PROVISIONER_A,
        metadata: { ...PVC_MIXED_FAKE_PROVISIONER_A.metadata, namespace: ns },
      } as any);
      await k8sClient.createPVC(ns, {
        ...PVC_MIXED_FAKE_PROVISIONER_B,
        metadata: { ...PVC_MIXED_FAKE_PROVISIONER_B.metadata, namespace: ns },
      } as any);
    });

    await test.step('Select both PVCs via a label selector and verify validation blocks submit', async () => {
      await page.goto(`/k8s/ns/${ns}/volumegroupsnapshots/~new/form`);
      await page.getByTestId('snapshot-name').fill('vgs-mixed-provisioner-test');
      await page.getByTestId('tags-input').fill('vgs-mixed-test=true');
      await page.getByTestId('tags-input').press('Enter');

      await expect(page.getByText(VALIDATION_ERROR)).toBeVisible({ timeout: 30_000 });
      await expect(page.locator('#save-changes')).toBeDisabled();
    });
  });
});
