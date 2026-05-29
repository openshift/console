import { test, expect } from '../../../fixtures';
import { ListPage } from '../../../pages/list-page';
import { ModalPage } from '../../../pages/modal-page';
import { PVC, testerDeployment, SnapshotClass, patchForVolume } from '../../../mocks/storage';

const isAws = String(process.env.BRIDGE_AWS).toLowerCase() === 'true';
const dropdownFirstOption = '[role="option"]';

test.describe('Snapshot Tests', { tag: ['@admin', '@storage'] }, () => {
  test.skip(!isAws, 'No CSI based storage classes are available on this platform');

  test('creates, lists, and deletes a VolumeSnapshot', async ({ page, k8sClient, cleanup }) => {
    const ns = `test-snap-${Date.now()}`;
    const pvcName = PVC.metadata.name;
    const snapshotName = `${pvcName}-snapshot`;
    const listPage = new ListPage(page);
    const modal = new ModalPage(page);

    await test.step('Set up namespace and resources', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createPVC(ns, { ...PVC, metadata: { ...PVC.metadata, namespace: ns } } as any);
      await k8sClient.createDeployment(ns, {
        ...testerDeployment,
        metadata: { ...testerDeployment.metadata, namespace: ns },
      } as any);
      await k8sClient
        .createClusterCustomResource(
          'snapshot.storage.k8s.io',
          'v1',
          'volumesnapshotclasses',
          SnapshotClass as any,
        )
        .catch((e) => {
          if (!String(e).includes('409')) throw e;
        });
    });

    await test.step('Wait for PVC to be Bound', async () => {
      await page.goto(`/k8s/ns/${ns}/persistentvolumeclaims`);
      await listPage.filterByName(pvcName);
      const pvcCell = listPage.getCell(pvcName);
      await expect(pvcCell.locator('xpath=ancestor::tr').locator('[data-test="status-text"]')).toContainText('Bound', {
        timeout: 120_000,
      });
    });

    await test.step('Create snapshot', async () => {
      await page.goto(`/k8s/ns/${ns}/snapshot.storage.k8s.io~v1~VolumeSnapshot`);
      await listPage.clickCreateButton();
      await page.getByTestId('pvc-dropdown').click();
      await page.locator(dropdownFirstOption).first().click();
      await page.getByTestId('snapshot-dropdown').click();
      await page.locator(dropdownFirstOption).first().click();
      await modal.submit();
    });

    await test.step('Verify snapshot details', async () => {
      await expect(page).toHaveURL(
        new RegExp(`snapshot.storage.k8s.io~v1~VolumeSnapshot/${snapshotName}`),
      );
      await expect(page.locator('[data-test="page-heading"]')).toContainText(pvcName);
      await expect(
        page.locator('[data-test-id="resource-summary"] [data-test="status-text"]'),
      ).toContainText('Ready', {
        timeout: 120_000,
      });

      const vs = (await k8sClient.getCustomResource(
        'snapshot.storage.k8s.io',
        'v1',
        ns,
        'volumesnapshots',
        snapshotName,
      )) as any;

      expect(vs.metadata.name).toBe(snapshotName);
      expect(vs.metadata.namespace).toBe(ns);
      expect(vs.spec.source.persistentVolumeClaimName).toBe(pvcName);

      await expect(page.locator('[data-test="details-item-value__VSC"] a')).toContainText(
        vs.status.boundVolumeSnapshotContentName,
      );
      await expect(page.locator('[data-test="details-item-value__SC"] a')).toContainText(
        vs.spec.volumeSnapshotClassName,
      );
    });

    await test.step('Verify snapshot in list', async () => {
      await page.goto(`/k8s/ns/${ns}/snapshot.storage.k8s.io~v1~VolumeSnapshot`);
      await listPage.waitForRows();
      await expect(listPage.getCell(snapshotName)).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Delete snapshot', async () => {
      await listPage.clickKebabAction(snapshotName, 'Delete VolumeSnapshot');
      await modal.waitForOpen();
      await expect(modal.getSubmitButton()).toBeEnabled({ timeout: 10_000 });
      await modal.submit();
      await modal.waitForClosed();
      await expect(listPage.getCell(snapshotName)).not.toBeAttached({ timeout: 90_000 });
    });

    await test.step('Clean up cluster-scoped resources', async () => {
      await k8sClient.deleteClusterCustomResource(
        'snapshot.storage.k8s.io',
        'v1',
        'volumesnapshotclasses',
        SnapshotClass.metadata.name,
      );
    });
  });

  test('restores a snapshot to create a new PVC', async ({ page, k8sClient, cleanup }) => {
    const ns = `test-snap-restore-${Date.now()}`;
    const pvcName = PVC.metadata.name;
    const snapshotName = `${pvcName}-snapshot`;
    const restoreName = `${snapshotName}-restore`;
    const listPage = new ListPage(page);
    const modal = new ModalPage(page);

    await test.step('Set up namespace and resources', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createPVC(ns, { ...PVC, metadata: { ...PVC.metadata, namespace: ns } } as any);
      await k8sClient.createDeployment(ns, {
        ...testerDeployment,
        metadata: { ...testerDeployment.metadata, namespace: ns },
      } as any);
      await k8sClient
        .createClusterCustomResource(
          'snapshot.storage.k8s.io',
          'v1',
          'volumesnapshotclasses',
          SnapshotClass as any,
        )
        .catch((e) => {
          if (!String(e).includes('409')) throw e;
        });
    });

    await test.step('Wait for PVC to be Bound', async () => {
      await page.goto(`/k8s/ns/${ns}/persistentvolumeclaims`);
      await listPage.filterByName(pvcName);
      const pvcCell = listPage.getCell(pvcName);
      await expect(pvcCell.locator('xpath=ancestor::tr').locator('[data-test="status-text"]')).toContainText('Bound', {
        timeout: 120_000,
      });
    });

    await test.step('Create snapshot', async () => {
      await page.goto(`/k8s/ns/${ns}/snapshot.storage.k8s.io~v1~VolumeSnapshot`);
      await listPage.clickCreateButton();
      await page.getByTestId('pvc-dropdown').click();
      await page.locator(dropdownFirstOption).first().click();
      await page.getByTestId('snapshot-dropdown').click();
      await page.locator(dropdownFirstOption).first().click();
      await modal.submit();
      await expect(
        page.locator('[data-test-id="resource-summary"] [data-test="status-text"]'),
      ).toContainText('Ready', {
        timeout: 120_000,
      });
    });

    await test.step('Restore snapshot as new PVC', async () => {
      await page.goto(`/k8s/ns/${ns}/snapshot.storage.k8s.io~v1~VolumeSnapshot`);
      await listPage.waitForRows();
      await listPage.clickKebabAction(snapshotName, 'Restore as new PVC');
      await modal.waitForOpen();
      await expect(page.getByTestId('pvc-name')).toHaveValue(restoreName);
      await page.locator('#restore-storage-class').click();
      await page.locator(dropdownFirstOption).nth(1).click();
      await modal.submit();
      await modal.waitForClosed();
    });

    await test.step('Patch deployment to use restored PVC and verify Bound', async () => {
      await k8sClient.patchDeployment(testerDeployment.metadata.name, ns, [patchForVolume]);
      await page.goto(`/k8s/ns/${ns}/persistentvolumeclaims/${restoreName}`);
      await expect(
        page.locator('[data-test-id="pvc-status"] [data-test="status-text"]'),
      ).toContainText('Bound', {
        timeout: 120_000,
      });
    });

    await test.step('Clean up cluster-scoped resources', async () => {
      await k8sClient.deleteClusterCustomResource(
        'snapshot.storage.k8s.io',
        'v1',
        'volumesnapshotclasses',
        SnapshotClass.metadata.name,
      );
    });
  });
});
