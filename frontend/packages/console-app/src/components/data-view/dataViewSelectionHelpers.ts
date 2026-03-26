import type { TableColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

const selectionColumnProps = {
  isStickyColumn: true,
  stickyMinWidth: '0',
  stickyLeftOffset: '0',
} as const;

/**
 * Creates a selection column definition for DataView tables.
 * This column displays checkboxes for row selection.
 *
 * @example
 * ```typescript
 * const columns = [
 *   createSelectionColumn(),
 *   { title: 'Name', id: 'name', ... },
 *   ...
 * ];
 * ```
 */
export const createSelectionColumn = <T>(): TableColumn<T> => ({
  title: '',
  id: 'select',
  props: selectionColumnProps,
});

type CreateSelectionCellOptions = {
  /** Row index in the table */
  rowIndex: number;
  /** Unique ID for the item being selected */
  itemId: string;
  /** Whether the item is currently selected */
  isSelected: boolean;
  /** Callback when selection state changes */
  onSelect: (itemId: string, isSelecting: boolean) => void;
  /** Whether the checkbox should be disabled */
  disabled?: boolean;
};

/**
 * Creates a selection cell object for a DataView row.
 * This cell contains the checkbox for row selection.
 *
 * @example
 * ```typescript
 * const rowCells = {
 *   select: createSelectionCell({
 *     rowIndex: 0,
 *     itemId: getUID(node),
 *     isSelected: selectedIds.has(getUID(node)),
 *     onSelect: onSelectItem,
 *   }),
 *   name: { cell: <NodeName node={node} /> },
 *   ...
 * };
 * ```
 */
export const createSelectionCell = ({
  rowIndex,
  itemId,
  isSelected,
  onSelect,
  disabled = false,
}: CreateSelectionCellOptions) => ({
  cell: '', // Checkbox is rendered via props, no content needed
  props: {
    ...selectionColumnProps,
    select: {
      rowIndex,
      onSelect: (_event: any, isSelecting: boolean) => {
        onSelect(itemId, isSelecting);
      },
      isSelected,
      isDisabled: disabled,
    },
  },
});
