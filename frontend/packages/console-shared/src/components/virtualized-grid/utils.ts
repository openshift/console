import { GroupedItems, CellItem } from './types';

/**
 *
 * @param groupedItems GroupedItems
 * @param columnCount number
 * Example:
 * groupedItems = {
 *    header: [item1, item2, item3, item4]
 * }
 * array of length 4 with header and number of columns 3
 * Based on the fixed width of column and number of items in the array Grid would be:
 *        |header              |
 *        |item1   item2  item3|
 *        |item4               |
 * this method returns the items array considering the above grid: [header, null, null, item1, item2, item3, item4, null null].
 *        |header   null   null |
 *        |item1    item2  item3|
 *        |item4    null   null |
 * which makes the rowCount: 3, columnCount: 3 and headerRows: [0]
 *
 * @returns {items, rowCount, columnCount, headerRows}
 * items: array will be used to render grid
 * rowCount: no. of rows in the grid
 * columnCount: number of column in the grid
 * headerRows: This array consists the index of rows in which header will be rendered so that height of those row can be changed.
 *
 */
export const getItemsAndRowCount = (
  groupedItems: GroupedItems,
  columnCount: number,
): { items: CellItem[]; rowCount: number; columnCount: number; headerRows: number[] } =>
  Object.keys(groupedItems).reduce(
    (
      {
        items: accItems,
        rowCount: accRowCount,
        columnCount: accColumnCount,
        headerRows: accHeaderRow,
      },
      currentKey,
    ) => {
      const items = [];
      const headerRows = [...accHeaderRow];
      // push header to the items at 0th column of row, and null for all other columns in the same row
      for (let i = 0; i < columnCount; i++) {
        if (i === 0) {
          items.push(currentKey);
          headerRows.push(accRowCount); // push row index to headerRows array
        } else {
          items.push(null);
        }
      }

      // find the number of rows for current group, say `x` using columncount say `y`
      const currentKeyItems = groupedItems[currentKey];
      const currentKeyItemCount = currentKeyItems.length;
      const rowCount = Math.ceil(currentKeyItemCount / accColumnCount);
      // total number of cells needed in the grid x * y
      const numberOfCell = accColumnCount * rowCount;
      // push grouped items in the matrix and push null for the remaining Grid cell
      for (let i = 0; i < numberOfCell; i++) {
        if (currentKeyItems[i]) {
          items.push(currentKeyItems[i]);
        } else {
          items.push(null);
        }
      }
      return {
        items: [...accItems, ...items],
        rowCount: accRowCount + rowCount + 1,
        columnCount: accColumnCount,
        headerRows,
      };
    },
    {
      items: [],
      rowCount: 0,
      columnCount,
      headerRows: [],
    },
  );
