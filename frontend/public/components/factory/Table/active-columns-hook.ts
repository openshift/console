import { useMemo } from 'react';
import {
  ALL_NAMESPACES_KEY,
  COLUMN_MANAGEMENT_USER_PREFERENCE_KEY,
} from '@console/shared/src/constants/common';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { TableColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

export const useActiveColumns = <D = any>({
  columns,
  showNamespaceOverride,
  columnManagementID,
}: {
  columns: TableColumn<D>[];
  showNamespaceOverride?: boolean;
  columnManagementID?: string;
}): [TableColumn<D>[], boolean] => {
  const [tableColumns, , columnPreferenceLoaded] = useUserPreference(
    COLUMN_MANAGEMENT_USER_PREFERENCE_KEY,
    undefined,
    true,
  );
  const [namespace] = useActiveNamespace();

  return useMemo(() => {
    const activeColumnIDs: Set<string> =
      tableColumns?.[columnManagementID]?.length > 0
        ? new Set(tableColumns[columnManagementID])
        : new Set(
            columns.map((col) => {
              if (col.id && !col.additional) {
                return col.id;
              }
            }),
          );

    if (showNamespaceOverride && !activeColumnIDs.has('namespace')) {
      activeColumnIDs.add('namespace');
    }

    let activeColumns = columns.filter((c) => activeColumnIDs.has(c.id) || c.title === '');
    if (namespace && namespace !== ALL_NAMESPACES_KEY && !showNamespaceOverride) {
      activeColumns = activeColumns.filter((column) => column.id !== 'namespace');
    }
    return [activeColumns, columnPreferenceLoaded];
  }, [
    tableColumns,
    columnManagementID,
    columns,
    namespace,
    showNamespaceOverride,
    columnPreferenceLoaded,
  ]);
};
