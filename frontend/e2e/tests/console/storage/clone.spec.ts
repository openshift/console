import { test, expect } from '../../../fixtures';
import { ListPage } from '../../../pages/list-page';
import { ModalPage } from '../../../pages/modal-page';
import { PVC, PVCGP3, testerDeployment } from '../../../mocks/storage';

const isAws = String(process.env.BRIDGE_AWS).toLowerCase() === 'true';
const cloneSize = '2';

test.describe('Clone Tests', { tag: ['@admin', '@storage'] }, () => {
  test.skip(!isAws, 'No CSI based storage classes are available on this platform');

  test('creates and deletes a PVC clone', async ({ page, k8sClient, cleanup }) => {
    const ns = `test-clone-${Date.now()}`;
    const pvcName = PVC.metadata.name;
    const cloneName = `${pvcName}-clone`;
    const listPage = new ListPage(page);
    const modal = new ModalPage(page);

    await test.step('Set up namespace and resources', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createPVC(ns, { ...PVC, metadata: { ...PVC.metadata, namespace: ns } } as any);
      await k8sClient.createPVC(ns, {
        ...PVCGP3,
        metadata: { ...PVCGP3.metadata, namespace: ns },
      } as any);
      await k8sClient.createDeployment(ns, {
        ...testerDeployment,
        metadata: { ...testerDeployment.metadata, namespace: ns },
      } as any);
    });

    await test.step('Wait for PVC to be Bound', async () => {
      await page.goto(`/k8s/ns/${ns}/persistentvolumeclaims`);
      await listPage.filterByName(pvcName);
      const pvcCell = listPage.getCell(pvcName);
      await expect(pvcCell.locator('xpath=ancestor::tr').locator('[data-test="status-text"]')).toContainText('Bound', {
        timeout: 120_000,
      });
    });

    await test.step('Clone PVC', async () => {
      await listPage.clickKebabAction(pvcName, 'Clone PVC');
      await modal.waitForOpen();
      await expect(modal.getSubmitButton()).toBeEnabled({ timeout: 10_000 });
      await page.getByTestId('input-request-size').fill(cloneSize);
      await modal.submit();
      await modal.waitForClosed();
    });

    await test.step('Verify clone details', async () => {
      await expect(page).toHaveURL(new RegExp(`persistentvolumeclaims/${cloneName}`));
      await expect(page.locator('[data-test="page-heading"]')).toContainText(cloneName);
      const pvc = await k8sClient.getPVC(cloneName, ns);
      expect((pvc as any).metadata.name).toBe(cloneName);
      expect((pvc as any).metadata.namespace).toBe(ns);
      await expect(page.getByTestId('pvc-requested-capacity')).toContainText(`${cloneSize} GiB`);
    });

    await test.step('Verify clone appears in list', async () => {
      await page.goto(`/k8s/ns/${ns}/persistentvolumeclaims`);
      await listPage.waitForRows();
      await expect(listPage.getCell(cloneName)).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Delete clone', async () => {
      await listPage.filterByName(cloneName);
      await listPage.clickKebabAction(cloneName, 'Delete PersistentVolumeClaim');
      await modal.waitForOpen();
      await expect(modal.getSubmitButton()).toBeEnabled({ timeout: 10_000 });
      await modal.submit();
      await modal.waitForClosed();
      await expect(listPage.getCell(cloneName)).not.toBeAttached({ timeout: 90_000 });
    });
  });

  test('creates PVC clone with different storage class', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `test-clone-sc-${Date.now()}`;
    const pvcName = PVC.metadata.name;
    const cloneName = `${pvcName}-clone`;
    const listPage = new ListPage(page);
    const modal = new ModalPage(page);

    await test.step('Set up namespace and resources', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createPVC(ns, { ...PVC, metadata: { ...PVC.metadata, namespace: ns } } as any);
      await k8sClient.createPVC(ns, {
        ...PVCGP3,
        metadata: { ...PVCGP3.metadata, namespace: ns },
      } as any);
      await k8sClient.createDeployment(ns, {
        ...testerDeployment,
        metadata: { ...testerDeployment.metadata, namespace: ns },
      } as any);
    });

    await test.step('Wait for PVC to be Bound', async () => {
      await page.goto(`/k8s/ns/${ns}/persistentvolumeclaims`);
      await listPage.filterByName(pvcName);
      const pvcCell = listPage.getCell(pvcName);
      await expect(pvcCell.locator('xpath=ancestor::tr').locator('[data-test="status-text"]')).toContainText('Bound', {
        timeout: 120_000,
      });
    });

    await test.step('Clone PVC with gp3-csi storage class', async () => {
      await listPage.clickKebabAction(pvcName, 'Clone PVC');
      await modal.waitForOpen();
      await expect(modal.getSubmitButton()).toBeEnabled({ timeout: 10_000 });
      await page.getByTestId('input-request-size').fill(cloneSize);
      await page.getByTestId('storage-class-dropdown').click();
      await page.getByRole('option', { name: /gp3-csi/ }).click();
      await modal.submit();
      await modal.waitForClosed();
    });

    await test.step('Verify clone details', async () => {
      await expect(page).toHaveURL(new RegExp(`persistentvolumeclaims/${cloneName}`));
      await expect(page.locator('[data-test="page-heading"]')).toContainText(cloneName);
      const pvc = await k8sClient.getPVC(cloneName, ns);
      expect((pvc as any).metadata.name).toBe(cloneName);
      expect((pvc as any).metadata.namespace).toBe(ns);
      await expect(page.getByTestId('pvc-requested-capacity')).toContainText(`${cloneSize} GiB`);
    });

    await test.step('Delete clone', async () => {
      await page.goto(`/k8s/ns/${ns}/persistentvolumeclaims`);
      await listPage.filterByName(cloneName);
      await listPage.clickKebabAction(cloneName, 'Delete PersistentVolumeClaim');
      await modal.waitForOpen();
      await expect(modal.getSubmitButton()).toBeEnabled({ timeout: 10_000 });
      await modal.submit();
      await modal.waitForClosed();
      await expect(listPage.getCell(cloneName)).not.toBeAttached({ timeout: 90_000 });
    });
  });
});
