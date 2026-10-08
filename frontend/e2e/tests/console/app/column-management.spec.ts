import { test, expect } from '../../../fixtures';
import { ListPage } from '../../../pages/list-page';

test.describe('Pods column management', { tag: ['@admin'] }, () => {
  test('preserves widths by column ID when reordering or hiding columns and resets widths independently', async ({
    page,
  }) => {
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
    const resizeColumn = async (columnID: string) => {
      const resizeButton = getColumnHeader(columnID).getByRole('button', {
        name: `Resize ${columnID} column`,
        exact: true,
      });
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
    const setColumnShown = async (columnTitle: string, isShown: boolean) => {
      await page.getByTestId('manage-columns').click();
      const modal = page.getByRole('dialog');
      await modal.getByRole('checkbox', { name: columnTitle, exact: true }).setChecked(isShown);
      await modal.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(modal).toBeHidden();
    };
    const reorderStatusAfterReady = async () => {
      await page.getByTestId('manage-columns').click();
      const modal = page.getByRole('dialog');
      const statusCheckbox = modal.getByRole('checkbox', { name: 'Status', exact: true });
      const statusRow = statusCheckbox.locator('xpath=ancestor::li');
      const dragHandle = statusRow.getByRole('button', { name: 'Drag button' });
      await expect(dragHandle).toBeEnabled();
      await dragHandle.focus();
      const dragOverlay = page.getByRole('list', { name: 'draggable overlay', exact: true });
      await page.keyboard.press('Space');
      await expect(dragOverlay).toBeVisible();
      await page.keyboard.press('ArrowDown');
      await expect(modal.getByRole('status')).toHaveText(
        'Draggable item status was moved over droppable area ready.',
      );
      await page.keyboard.press('Space');
      await expect(dragOverlay).toBeHidden();
      await expect
        .poll(() =>
          modal
            .locator('[data-ouia-component-id="ColumnManagementModal-column-list"] li')
            .evaluateAll((items) => {
              const readyIndex = items.findIndex((item) => item.id === 'ready');
              const statusIndex = items.findIndex((item) => item.id === 'status');
              return readyIndex >= 0 && statusIndex > readyIndex;
            }),
        )
        .toBe(true);
      await modal.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(modal).toBeHidden();
    };

    await restoreDefaults();
    await page.getByTestId('reset-column-widths').click();
    const defaultStatusWidth = await getColumnWidth('status');
    const defaultReadyWidth = await getColumnWidth('ready');
    await expectColumnBefore('status', 'ready');

    await resizeColumn('status');
    await expect.poll(() => getColumnWidth('status')).toBeGreaterThan(defaultStatusWidth);
    const resizedStatusWidth = await getColumnWidth('status');
    await resizeColumn('ready');
    await expect.poll(() => getColumnWidth('ready')).toBeGreaterThan(defaultReadyWidth);
    const resizedReadyWidth = await getColumnWidth('ready');

    await reorderStatusAfterReady();
    await expectColumnBefore('ready', 'status');
    await expect.poll(() => getColumnWidth('status')).toBeCloseTo(resizedStatusWidth, 0);
    await expect.poll(() => getColumnWidth('ready')).toBeCloseTo(resizedReadyWidth, 0);

    await setColumnShown('Ready', false);
    await expect(getColumnHeader('ready')).toBeHidden();
    await expect.poll(() => getColumnWidth('status')).toBeCloseTo(resizedStatusWidth, 0);

    await setColumnShown('Ready', true);
    await expectColumnBefore('ready', 'status');
    await expect.poll(() => getColumnWidth('status')).toBeCloseTo(resizedStatusWidth, 0);
    await expect.poll(() => getColumnWidth('ready')).toBeCloseTo(resizedReadyWidth, 0);

    await page.getByTestId('reset-column-widths').click();
    await expect.poll(() => getColumnWidth('status')).toBeCloseTo(defaultStatusWidth, 0);
    await expect.poll(() => getColumnWidth('ready')).toBeCloseTo(defaultReadyWidth, 0);
    await expectColumnBefore('ready', 'status');

    await resizeColumn('status');
    const widthBeforeRestoringDefaults = await getColumnWidth('status');
    await restoreDefaults();
    await expectColumnBefore('status', 'ready');
    await expect.poll(() => getColumnWidth('status')).toBeCloseTo(widthBeforeRestoringDefaults, 0);

    await page.getByTestId('reset-column-widths').click();
    await expect.poll(() => getColumnWidth('status')).toBeCloseTo(defaultStatusWidth, 0);
  });
});
