import * as React from 'react';
import { OnSelect } from '@patternfly/react-table';
import { K8sResourceCommon } from '@console/internal/module/k8s';

export const useSelectList = <R extends K8sResourceCommon>(
  data: R[],
  visibleRows: Set<string>,
  onRowSelected: (rows: R[]) => void,
): {
  onSelect: OnSelect;
  selectedRows: Set<string>;
  updateSelectedRows: (rows: R[]) => void;
} => {
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());

  const onSelect = React.useCallback(
    (_event, isSelected, rowIndex, rowData) => {
      const uniqueUIDs: Set<string> = selectedRows ? new Set([...selectedRows]) : new Set<string>();

      if (rowIndex === -1) {
        isSelected
          ? visibleRows.forEach((uid) => uniqueUIDs.add(uid))
          : visibleRows.forEach((uid) => uniqueUIDs.delete(uid));
      } else {
        isSelected ? uniqueUIDs.add(rowData?.props?.id) : uniqueUIDs.delete(rowData?.props?.id);
      }

      setSelectedRows(uniqueUIDs);
      onRowSelected(data.filter((row) => uniqueUIDs.has(row.metadata.uid)));
    },
    [data, onRowSelected, selectedRows, visibleRows],
  );

  const updateSelectedRows = React.useCallback(
    (rows: R[]) => {
      onRowSelected(rows);
      setSelectedRows(new Set(rows.map((row) => row.metadata.uid)));
    },
    [onRowSelected],
  );

  return {
    onSelect,
    selectedRows,
    updateSelectedRows,
  };
};
