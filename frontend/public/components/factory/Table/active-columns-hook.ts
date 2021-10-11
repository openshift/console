import * as React from 'react';
import {
  ALL_NAMESPACES_KEY,
  COLUMN_MANAGEMENT_CONFIGMAP_KEY,
  COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
  useActiveNamespace,
  useUserSettingsCompatibility,
} from '@console/shared';
import { TableColumn } from '@console/dynamic-plugin-sdk';

export const useActiveColumns = <D = any>({
  columns,
  showNamespaceOverride,
  columnManagementID,
}: {
  columns: TableColumn<D>[];
  showNamespaceOverride?: boolean;
  columnManagementID?: string;
}): [TableColumn<D>[], boolean] => {
  const [tableColumns, , userSettingsLoaded] = useUserSettingsCompatibility(
    COLUMN_MANAGEMENT_CONFIGMAP_KEY,
    COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
    undefined,
    true,
  );
  const [namespace] = useActiveNamespace();

  return React.useMemo(() => {
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
    return [activeColumns, userSettingsLoaded];
  }, [
    tableColumns,
    columnManagementID,
    columns,
    namespace,
    showNamespaceOverride,
    userSettingsLoaded,
  ]);
};
