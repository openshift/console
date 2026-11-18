import type { MouseEvent } from 'react';
import { useCallback, useMemo } from 'react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { COLUMN_WIDTH_USER_PREFERENCE_KEY } from '@console/shared/src/constants/common';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

/** Stored widths by table ID and column ID. */
type ColumnWidthUserSettings = Record<string, Record<string, number>>;

type ResizableColumnsOptions<TData> = {
  columns: ConsoleDataViewColumn<TData>[];
  tableID?: string;
  isResizable: boolean;
};

/** Adds saved widths and resize handlers to the final built-in and extension columns. */
export const useConsoleDataViewResizableColumns = <TData>({
  columns,
  tableID,
  isResizable,
}: ResizableColumnsOptions<TData>) => {
  const [columnWidths, setColumnWidths] = useUserPreference<ColumnWidthUserSettings>(
    COLUMN_WIDTH_USER_PREFERENCE_KEY,
    undefined,
    Boolean(tableID && isResizable),
  );

  const setColumnWidth = useCallback(
    (columnID: string, width: number) => {
      if (!tableID || !isResizable) {
        return;
      }
      setColumnWidths((previous) => ({
        ...previous,
        [tableID]: {
          ...previous?.[tableID],
          [columnID]: width,
        },
      }));
    },
    [tableID, isResizable, setColumnWidths],
  );

  const resetColumnWidths = useCallback(() => {
    if (!tableID || !isResizable) {
      return;
    }
    setColumnWidths((previous) => {
      const { [tableID]: _removed, ...remaining } = previous ?? {};
      return remaining;
    });
  }, [tableID, isResizable, setColumnWidths]);

  const resizableColumns = useMemo(
    () =>
      tableID && isResizable
        ? columns.map((column) => {
            if (
              !(column.resizableProps?.isResizable ?? Boolean(column.title)) ||
              column.resizableProps?.onResize
            ) {
              return column;
            }

            const savedWidth = columnWidths?.[tableID]?.[column.id];
            return {
              ...column,
              ...(savedWidth !== undefined && column.props?.style?.width !== undefined
                ? {
                    props: {
                      ...column.props,
                      style: { ...column.props.style, width: savedWidth },
                    },
                  }
                : {}),
              resizableProps: {
                ...column.resizableProps,
                isResizable: true as const,
                width: savedWidth ?? column.resizableProps?.width,
                onResize: (
                  _event: MouseEvent<HTMLDivElement>,
                  _id: string | number | undefined,
                  width: number,
                ) => setColumnWidth(column.id, width),
                resizeButtonAriaLabel:
                  column.resizableProps?.resizeButtonAriaLabel ?? `Resize ${column.id} column`,
              },
            };
          })
        : columns,
    [columns, columnWidths, tableID, isResizable, setColumnWidth],
  );

  return { columns: resizableColumns, resetColumnWidths };
};
