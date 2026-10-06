import { test, expect } from '../../../fixtures';
import { ListPage } from '../../../pages/list-page';

test.describe('Pods column management', { tag: ['@admin'] }, () => {
  test('reorders columns, resets widths independently, and restores defaults', async ({ page }) => {
    const listPage = new ListPage(page);
    await page.goto('/k8s/all-namespaces/pods');
    await listPage.waitForRows();

    const getColumnHeader = (columnID: string) => {
      const resizeButton = page.getByRole('button', {
        name: `Resize ${columnID} column`,
        exact: true,
      });
      return listPage.table.getByRole('columnheader').filter({ has: resizeButton });
    };
    const getColumnWidth = async (columnID: string): Promise<number> =>
      getColumnHeader(columnID).evaluate((element: HTMLElement) =>
        parseFloat(element.style.minWidth),
      );
    const getColumnIndex = async (columnID: string): Promise<number> =>
      getColumnHeader(columnID).evaluate((element: HTMLTableCellElement) => element.cellIndex);
    const expectColumnBefore = async (firstColumnID: string, secondColumnID: string) => {
      await expect
        .poll(
          async () =>
            (await getColumnIndex(firstColumnID)) < (await getColumnIndex(secondColumnID)),
        )
        .toBe(true);
    };
    const resizeStatusColumn = async () => {
      const resizeButton = page.getByRole('button', { name: 'Resize status column', exact: true });
      for (let step = 0; step < 8; step++) {
        await resizeButton.press('Shift+ArrowRight');
      }
    };
    const restoreDefaults = async () => {
      await page.getByTestId('manage-columns').click();
      const modal = page.getByRole('dialog');
      await modal.getByRole('button', { name: 'Restore default columns', exact: true }).click();
      await modal.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(modal).toBeHidden();
    };
    const reorderStatusAfterReady = async () => {
      await page.getByTestId('manage-columns').click();
      const modal = page.getByRole('dialog');
      const statusCheckbox = modal.getByRole('checkbox', { name: 'Status', exact: true });
      const statusRow = statusCheckbox.locator('xpath=ancestor::li');
      const dragHandle = statusRow.getByRole('button', { name: 'Drag button' });
      const readyCheckbox = modal.getByRole('checkbox', { name: 'Ready', exact: true });
      const readyRow = readyCheckbox.locator('xpath=ancestor::li');
      const readyDragHandle = readyRow.getByRole('button', { name: 'Drag button' });
      await expect(dragHandle).toBeEnabled();
      await dragHandle.dragTo(readyDragHandle);
      await expect
        .poll(() =>
          modal
            .locator('[data-ouia-component-id="ColumnManagementModal-column-list"] li')
            .evaluateAll(
              (items) =>
                items.findIndex((item) => item.id === 'ready') <
                items.findIndex((item) => item.id === 'status'),
            ),
        )
        .toBe(true);
      await modal.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(modal).toBeHidden();
    };

    await restoreDefaults();
    await page.getByTestId('reset-column-widths').click();
    const defaultStatusWidth = await getColumnWidth('status');
    await expectColumnBefore('status', 'ready');

    await resizeStatusColumn();
    await expect.poll(() => getColumnWidth('status')).toBeGreaterThan(defaultStatusWidth);

    await reorderStatusAfterReady();
    await expectColumnBefore('ready', 'status');
    await expect.poll(() => getColumnWidth('status')).toBeCloseTo(defaultStatusWidth, 0);

    await resizeStatusColumn();
    await page.getByTestId('reset-column-widths').click();
    await expect.poll(() => getColumnWidth('status')).toBeCloseTo(defaultStatusWidth, 0);
    await expectColumnBefore('ready', 'status');

    await resizeStatusColumn();
    await restoreDefaults();
    await expectColumnBefore('status', 'ready');
    await expect.poll(() => getColumnWidth('status')).toBeCloseTo(defaultStatusWidth, 0);
  });
});
