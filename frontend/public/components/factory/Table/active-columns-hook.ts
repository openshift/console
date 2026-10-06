import { useMemo } from 'react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  ALL_NAMESPACES_KEY,
  COLUMN_MANAGEMENT_ORDER_USER_PREFERENCE_KEY,
  COLUMN_MANAGEMENT_USER_PREFERENCE_KEY,
} from '@console/shared/src/constants/common';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

export const useActiveColumns = <D = any>({
  columns,
  showNamespaceOverride,
  columnManagementID,
}: {
  columns: ConsoleDataViewColumn<D>[];
  showNamespaceOverride?: boolean;
  columnManagementID?: string;
}): [ConsoleDataViewColumn<D>[], boolean] => {
  const [tableColumns, , columnPreferenceLoaded] = useUserPreference(
    COLUMN_MANAGEMENT_USER_PREFERENCE_KEY,
    undefined,
    true,
  );
  const [columnOrders, , orderPreferenceLoaded] = useUserPreference<Record<string, string[]>>(
    COLUMN_MANAGEMENT_ORDER_USER_PREFERENCE_KEY,
    undefined,
    true,
  );
  const [namespace] = useActiveNamespace();

  return useMemo(() => {
    const selectedColumnIDs = tableColumns?.[columnManagementID];
    const hasSelectedColumnIDs = selectedColumnIDs?.length > 0;
    const preferredColumnIDs = columnOrders?.[columnManagementID]?.length
      ? columnOrders[columnManagementID]
      : selectedColumnIDs;
    const hasPreferredColumnOrder = preferredColumnIDs?.length > 0;
    const activeColumnIDs: Set<string> = hasSelectedColumnIDs
      ? new Set(selectedColumnIDs)
      : new Set(
          columns.map((col) => {
            if (col.id && !col.additional) {
              return col.id;
            }
            return undefined;
          }),
        );

    if (showNamespaceOverride && !activeColumnIDs.has('namespace')) {
      activeColumnIDs.add('namespace');
    }

    let activeColumns = columns.filter((c) => activeColumnIDs.has(c.id) || c.title === '');
    if (namespace && namespace !== ALL_NAMESPACES_KEY && !showNamespaceOverride) {
      activeColumns = activeColumns.filter((column) => column.id !== 'namespace');
    }

    if (hasPreferredColumnOrder) {
      const fixedColumnIDs = new Set(
        columns.filter(({ props }) => props?.isStickyColumn).map(({ id }) => id),
      );
      const columnOrder = new Map<string, number>(
        preferredColumnIDs.map((id, index) => [id, index] as [string, number]),
      );
      const orderedManagedColumns = activeColumns
        .filter(({ id }) => columnOrder.has(id) && !fixedColumnIDs.has(id))
        .sort((a, b) => (columnOrder.get(a.id) ?? 0) - (columnOrder.get(b.id) ?? 0));
      let nextManagedColumn = 0;
      activeColumns = activeColumns.map((column) => {
        if (fixedColumnIDs.has(column.id) || !columnOrder.has(column.id)) {
          return column;
        }
        return orderedManagedColumns[nextManagedColumn++] ?? column;
      });
    }

    return [activeColumns, columnPreferenceLoaded && orderPreferenceLoaded];
  }, [
    tableColumns,
    columnOrders,
    columnManagementID,
    columns,
    namespace,
    showNamespaceOverride,
    columnPreferenceLoaded,
    orderPreferenceLoaded,
  ]);
};
