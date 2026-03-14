import type { MouseEvent } from 'react';
import { useCallback, useMemo } from 'react';
import type { K8sModel } from '@console/dynamic-plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
import { COLUMN_WIDTH_CONFIGMAP_KEY } from '@console/shared/src/constants/common';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

/**
 * Stored column widths keyed by table then column for easy reading in the configMap.
 * Example: { "core~v1~Pod": { "name": 200, "namespace": 150 } }
 */
export type ColumnWidthUserSettings = Record<string, Record<string, number>>;

/** Callback when a table column is resized: event, column id, and new width in pixels. */
type ColumnResizeOnResize = (
  event: MouseEvent<HTMLDivElement>,
  id: string | number | undefined,
  width: number,
) => void;

/**
 * Table-level hook: one source of truth per table so that each column resize merges into
 * the same state and creates/updates an entry for that column without replacing others.
 * Use this when a table has many columns so that all column widths are stored under one
 * configMap key and each resize adds/updates only that column's entry.
 *
 * @param model - K8s model (e.g. PodModel) for the resource table
 * @returns getResizableProps(columnId), getWidth(columnId), and resetAllColumnWidths()
 */
export const useColumnWidthSettings = (
  model: K8sModel,
): {
  getResizableProps: (
    columnId: string,
  ) => {
    isResizable: true;
    width?: number;
    onResize: ColumnResizeOnResize;
    resizeButtonAriaLabel: string;
  };
  getWidth: (columnId: string) => number | undefined;
  /** Reset saved widths for all columns in this table. */
  resetAllColumnWidths: () => void;
} => {
  const resolvedTableId = useMemo(() => referenceForModel(model), [model]);

  const [columnWidths, setColumnWidths] = useUserPreference<ColumnWidthUserSettings>(
    COLUMN_WIDTH_CONFIGMAP_KEY,
    {},
  );

  const setColumnWidth = useCallback(
    (columnId: string, newWidth: number) => {
      setColumnWidths((prev) => {
        const existing = prev ?? {};
        const tableColumns = existing[resolvedTableId] ?? {};
        return {
          ...existing,
          [resolvedTableId]: {
            ...tableColumns,
            [columnId]: newWidth,
          },
        };
      });
    },
    [resolvedTableId, setColumnWidths],
  );

  const resetAllColumnWidths = useCallback(() => {
    setColumnWidths((prev) => {
      const existing = prev ?? {};
      const { [resolvedTableId]: _removed, ...rest } = existing;
      return rest;
    });
  }, [resolvedTableId, setColumnWidths]);

  const getWidth = useCallback((columnId: string) => columnWidths?.[resolvedTableId]?.[columnId], [
    columnWidths,
    resolvedTableId,
  ]);

  const getResizableProps = useCallback(
    (columnId: string) => {
      const onResize: ColumnResizeOnResize = (_event, _id, newWidth) =>
        setColumnWidth(columnId, newWidth);
      return {
        isResizable: true as const,
        width: columnWidths?.[resolvedTableId]?.[columnId],
        onResize,
        resizeButtonAriaLabel: `Resize ${columnId} column`,
      };
    },
    [columnWidths, resolvedTableId, setColumnWidth],
  );

  return { getResizableProps, getWidth, resetAllColumnWidths };
};

/**
 * Per-column hook for resizable props. Prefer {@link useColumnWidthSettings} for tables
 * with many columns so that one configMap entry holds all column widths and each resize
 * creates/updates only that column's entry.
 */
export const useResizableColumnProps = (
  model: K8sModel,
  columnId: string,
): {
  isResizable: true;
  width?: number;
  onResize: ColumnResizeOnResize;
  resizeButtonAriaLabel: string;
  resetAllColumnWidths: () => void;
} => {
  const { getResizableProps, getWidth, resetAllColumnWidths } = useColumnWidthSettings(model);
  const resizableProps = getResizableProps(columnId);
  return useMemo(
    () => ({
      ...resizableProps,
      width: getWidth(columnId),
      resetAllColumnWidths,
    }),
    [resizableProps, getWidth, columnId, resetAllColumnWidths],
  );
};
