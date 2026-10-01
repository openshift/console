import type { FormEvent } from 'react';
import type {
  CreateSelectionCell,
  CreateSelectionColumn,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { selectionColumnProps } from './ConsoleDataView';

/**
 * Creates a selection column definition for DataView tables.
 * This column displays checkboxes for row selection.
 * The select-all checkbox in the header is added by ConsoleDataView when
 * selection.onSelectAll is provided.
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
export const createSelectionColumn: CreateSelectionColumn = () => ({
  title: '',
  id: 'select',
  props: selectionColumnProps,
});

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
export const createSelectionCell: CreateSelectionCell = ({
  rowIndex,
  itemId,
  isSelected,
  onSelect,
  disabled = false,
}) => ({
  cell: '', // Checkbox is rendered via props, no content needed
  props: {
    ...selectionColumnProps,
    select: {
      rowIndex,
      onSelect: (_event: FormEvent<HTMLInputElement>, isSelecting: boolean) => {
        onSelect(itemId, isSelecting);
      },
      // Ensure isSelected is always a boolean to prevent controlled/uncontrolled warnings
      isSelected: Boolean(isSelected),
      isDisabled: disabled,
    },
  },
});
