import { test, expect } from '../../../fixtures';
import { ListPage } from '../../../pages/list-page';
import { ModalPage } from '../../../pages/modal-page';
import { PVC, PVCGP3, testerDeployment, isAwsPlatform } from '../../../mocks/storage';

const cloneSize = '2';
const decimalCloneSize = '1.5';

const PVC_BOUND_TIMEOUT = 120_000;
const MODAL_READY_TIMEOUT = 10_000;
const LIST_VISIBLE_TIMEOUT = 30_000;
const DELETE_GONE_TIMEOUT = 90_000;

test.describe('Clone Tests', { tag: ['@admin', '@storage'] }, () => {
  test('creates and deletes a PVC clone', async ({ page, k8sClient, cleanup }) => {
    test.skip(
      !(await isAwsPlatform(k8sClient)),
      'No CSI based storage classes are available on this platform',
    );
    const ns = `test-clone-${Date.now()}`;
    const pvcName = PVC.metadata.name;
    const cloneName = `${pvcName}-clone`;
    const listPage = new ListPage(page);
    const modal = new ModalPage(page);

    await test.step('Set up namespace and resources', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createPVC(ns, {
        ...PVC,
        metadata: { ...PVC.metadata, namespace: ns },
      } as any);
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
      await listPage.waitForRows();
      await listPage.filterByName(pvcName);
      const pvcRow = listPage.getCell(pvcName).locator('xpath=ancestor::tr');
      await expect(pvcRow.locator('[data-test="status-text"]')).toContainText('Bound', {
        timeout: PVC_BOUND_TIMEOUT,
      });
    });

    await test.step('Clone PVC', async () => {
      await listPage.clickKebabAction(pvcName, 'Clone PVC');
      await modal.waitForOpen();
      await expect(modal.getSubmitButton()).toBeEnabled({ timeout: MODAL_READY_TIMEOUT });
      await page.getByTestId('input-request-size').fill(cloneSize);
      await modal.submit();
      await modal.waitForClosed();
    });

    await test.step('Verify clone details', async () => {
      await expect(page).toHaveURL(new RegExp(`persistentvolumeclaims/${cloneName}`));
      await expect(page.getByTestId('page-heading')).toContainText(cloneName);
      const pvc = await k8sClient.getPVC(cloneName, ns);
      expect((pvc as any).metadata.name).toBe(cloneName);
      expect((pvc as any).metadata.namespace).toBe(ns);
      await expect(page.getByTestId('pvc-requested-capacity')).toContainText(`${cloneSize} GiB`);
    });

    await test.step('Verify clone appears in list', async () => {
      await page.goto(`/k8s/ns/${ns}/persistentvolumeclaims`);
      await listPage.waitForRows();
      await expect(listPage.getCell(cloneName)).toBeVisible({ timeout: LIST_VISIBLE_TIMEOUT });
    });

    await test.step('Delete clone', async () => {
      await listPage.filterByName(cloneName);
      await listPage.clickKebabAction(cloneName, 'Delete PersistentVolumeClaim');
      await modal.waitForOpen();
      await expect(modal.getSubmitButton()).toBeEnabled({ timeout: MODAL_READY_TIMEOUT });
      await modal.submit();
      await modal.waitForClosed();
      await expect(listPage.getCell(cloneName)).not.toBeAttached({ timeout: DELETE_GONE_TIMEOUT });
    });
  });

  test('creates PVC clone with different storage class', async ({ page, k8sClient, cleanup }) => {
    test.skip(
      !(await isAwsPlatform(k8sClient)),
      'No CSI based storage classes are available on this platform',
    );
    const ns = `test-clone-sc-${Date.now()}`;
    const pvcName = PVC.metadata.name;
    const cloneName = `${pvcName}-clone`;
    const listPage = new ListPage(page);
    const modal = new ModalPage(page);

    await test.step('Set up namespace and resources', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createPVC(ns, {
        ...PVC,
        metadata: { ...PVC.metadata, namespace: ns },
      } as any);
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
      await listPage.waitForRows();
      await listPage.filterByName(pvcName);
      const pvcRow = listPage.getCell(pvcName).locator('xpath=ancestor::tr');
      await expect(pvcRow.locator('[data-test="status-text"]')).toContainText('Bound', {
        timeout: PVC_BOUND_TIMEOUT,
      });
    });

    await test.step('Clone PVC with gp3-csi storage class', async () => {
      await listPage.clickKebabAction(pvcName, 'Clone PVC');
      await modal.waitForOpen();
      await expect(modal.getSubmitButton()).toBeEnabled({ timeout: MODAL_READY_TIMEOUT });
      await page.getByTestId('input-request-size').fill(cloneSize);
      await page.getByTestId('storage-class-dropdown').click();
      await page.getByRole('option', { name: /gp3-csi/ }).click();
      await modal.submit();
      await modal.waitForClosed();
    });

    await test.step('Verify clone details', async () => {
      await expect(page).toHaveURL(new RegExp(`persistentvolumeclaims/${cloneName}`));
      await expect(page.getByTestId('page-heading')).toContainText(cloneName);
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
      await expect(modal.getSubmitButton()).toBeEnabled({ timeout: MODAL_READY_TIMEOUT });
      await modal.submit();
      await modal.waitForClosed();
      await expect(listPage.getCell(cloneName)).not.toBeAttached({ timeout: DELETE_GONE_TIMEOUT });
    });
  });

  test('creates PVC clone with decimal size', async ({ page, k8sClient, cleanup }) => {
    test.skip(
      !(await isAwsPlatform(k8sClient)),
      'No CSI based storage classes are available on this platform',
    );
    const ns = `test-clone-decimal-${Date.now()}`;
    const pvcName = PVC.metadata.name;
    const cloneName = `${pvcName}-clone`;
    const listPage = new ListPage(page);
    const modal = new ModalPage(page);

    await test.step('Set up namespace and resources', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createPVC(ns, {
        ...PVC,
        metadata: { ...PVC.metadata, namespace: ns },
      } as any);
      await k8sClient.createDeployment(ns, {
        ...testerDeployment,
        metadata: { ...testerDeployment.metadata, namespace: ns },
      } as any);
    });

    await test.step('Wait for PVC to be Bound', async () => {
      await page.goto(`/k8s/ns/${ns}/persistentvolumeclaims`);
      await listPage.waitForRows();
      await listPage.filterByName(pvcName);
      const pvcRow = listPage.getCell(pvcName).locator('xpath=ancestor::tr');
      await expect(pvcRow.locator('[data-test="status-text"]')).toContainText('Bound', {
        timeout: PVC_BOUND_TIMEOUT,
      });
    });

    await test.step('Clone PVC with decimal size', async () => {
      await listPage.clickKebabAction(pvcName, 'Clone PVC');
      await modal.waitForOpen();
      await expect(modal.getSubmitButton()).toBeEnabled({ timeout: MODAL_READY_TIMEOUT });
      await page.getByTestId('input-request-size').fill(decimalCloneSize);
      await modal.submit();
      await modal.waitForClosed();
    });

    await test.step('Verify clone details include decimal size', async () => {
      await expect(page).toHaveURL(new RegExp(`persistentvolumeclaims/${cloneName}`));
      await expect(page.getByTestId('page-heading')).toContainText(cloneName);
      const pvc = await k8sClient.getPVC(cloneName, ns);
      expect((pvc as any).metadata.name).toBe(cloneName);
      // API stores canonical Quantity (1.5Gi → 1536Mi)
      expect((pvc as any).spec.resources.requests.storage).toBe('1536Mi');
      await expect(page.getByTestId('pvc-requested-capacity')).toContainText(
        `${decimalCloneSize} GiB`,
      );
    });

    await test.step('Delete clone', async () => {
      await page.goto(`/k8s/ns/${ns}/persistentvolumeclaims`);
      await listPage.filterByName(cloneName);
      await listPage.clickKebabAction(cloneName, 'Delete PersistentVolumeClaim');
      await modal.waitForOpen();
      await expect(modal.getSubmitButton()).toBeEnabled({ timeout: MODAL_READY_TIMEOUT });
      await modal.submit();
      await modal.waitForClosed();
      await expect(listPage.getCell(cloneName)).not.toBeAttached({ timeout: DELETE_GONE_TIMEOUT });
    });
  });
});
