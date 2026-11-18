import type { FormEvent, ReactNode } from 'react';
import type { DataViewTd } from '@patternfly/react-data-view/dist/esm/DataViewTable/DataViewTable';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

/**
 * Creates the checkbox column managed by ConsoleDataView.
 */
export const createSelectionColumn = <TData>(): ConsoleDataViewColumn<TData> => ({
  title: '',
  id: 'select',
  type: 'selection' as const,
});

/**
 * Creates a checkbox cell for a row managed by ConsoleDataView.
 */
export const createSelectionCell = ({
  rowIndex,
  itemId,
  isSelected,
  onSelect,
  disabled = false,
}: {
  rowIndex: number;
  itemId: string;
  isSelected: boolean;
  onSelect: (itemId: string, isSelecting: boolean) => void;
  disabled?: boolean;
}): Extract<DataViewTd, { cell: ReactNode }> => ({
  cell: '', // Checkbox is rendered via props, no content needed
  props: {
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
