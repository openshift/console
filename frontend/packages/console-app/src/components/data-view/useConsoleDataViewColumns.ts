import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { LoadedAndResolvedExtension } from '@openshift/dynamic-plugin-sdk';
import type { DataViewTd } from '@patternfly/react-data-view/dist/esm/DataViewTable/DataViewTable';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type {
  ColumnLayout,
  ConsoleDataViewColumn,
  GetDataViewRows,
  ResourceMetadata,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { isConsoleDataViewTableColumn } from '@console/dynamic-plugin-sdk/src/extensions/dataview';
import type { ConsoleDataViewTableColumn } from '@console/dynamic-plugin-sdk/src/extensions/dataview';
import { useTranslatedExtensions } from '@console/plugin-sdk/src/utils/useTranslatedExtensions';
import { getConsoleDataViewID } from './getConsoleDataViewID';
import { useConsoleDataViewResizableColumns } from './useConsoleDataViewResizableColumns';

type ResolvedTableColumn = LoadedAndResolvedExtension<ConsoleDataViewTableColumn>;

const cellIsStickyProps = {
  isStickyColumn: true,
  stickyMinWidth: '0',
};

const selectionColumnWidth = '45px';
const selectionColumnProps = {
  ...cellIsStickyProps,
  stickyLeftOffset: '0',
  stickyMinWidth: selectionColumnWidth,
  style: { maxWidth: selectionColumnWidth },
};

const nameCellProps = {
  ...cellIsStickyProps,
  hasRightBorder: true,
};

const actionsCellProps = {
  ...cellIsStickyProps,
  hasLeftBorder: true,
  isActionCell: true,
};

const getDefaultProps = (
  type: ConsoleDataViewColumn<unknown>['type'],
  hasSelection: boolean,
  isHeader = false,
) => {
  switch (type) {
    case 'name':
      return hasSelection
        ? { ...nameCellProps, stickyLeftOffset: selectionColumnWidth }
        : nameCellProps;
    case 'actions':
      return isHeader ? { ...cellIsStickyProps, hasLeftBorder: true } : actionsCellProps;
    case 'selection':
      return selectionColumnProps;
    case 'sticky':
      return cellIsStickyProps;
    default:
      return undefined;
  }
};

const compareExtensions = (a: ResolvedTableColumn, b: ResolvedTableColumn): number =>
  a.pluginName.localeCompare(b.pluginName) ||
  a.properties.columnData.id.localeCompare(b.properties.columnData.id) ||
  a.uid.localeCompare(b.uid);

const isValidColumnData = (
  columnData: unknown,
): columnData is ConsoleDataViewColumn<unknown> & { title: string } => {
  if (!columnData || typeof columnData !== 'object' || Array.isArray(columnData)) return false;
  const { id, title } = columnData as Record<string, unknown>;
  return typeof id === 'string' && id.length > 0 && typeof title === 'string' && title.length > 0;
};

/** Keep built-in columns fixed and place equally anchored plugin columns in plugin-name/ID order. */
export const orderConsoleDataViewColumns = <TData>(
  builtInColumns: ConsoleDataViewColumn<TData>[],
  extensions: ResolvedTableColumn[],
): {
  columns: ConsoleDataViewColumn<TData>[];
  extensionsByID: Map<string, ResolvedTableColumn>;
} => {
  const columns = [...builtInColumns];
  const extensionsByID = new Map<string, ResolvedTableColumn>();
  const knownIDs = new Set(columns.map(({ id }) => id));
  const validExtensions = [...extensions]
    .filter((extension) => isValidColumnData(extension.properties?.columnData))
    .sort(compareExtensions)
    .filter((extension) => {
      const { id } = extension.properties.columnData;
      if (knownIDs.has(id)) return false;
      knownIDs.add(id);
      return true;
    });

  const insert = (extension: ResolvedTableColumn, index: number): void => {
    const { columnData } = extension.properties;
    const columnDefinition = { ...columnData } as ConsoleDataViewColumn<TData>;
    // Column type controls Console behavior and cannot be set by an extension.
    delete columnDefinition.type;
    columns.splice(index, 0, {
      ...columnDefinition,
      additional: columnData.additional ?? true,
    } as ConsoleDataViewColumn<TData>);
    extensionsByID.set(columnData.id, extension);
  };
  const defaultIndex = (): number => {
    const actionIndex = columns.findIndex(
      ({ id, type }) => id === '' || id === 'actions' || type === 'actions',
    );
    return actionIndex < 0 ? columns.length : actionIndex;
  };
  const lastAfter = new Map<string, string>();

  let pending = validExtensions;
  while (pending.length) {
    const next: ResolvedTableColumn[] = [];
    let placed = false;

    pending.forEach((extension) => {
      const { insertBefore, insertAfter } = extension.properties;
      const beforeIndex = insertBefore ? columns.findIndex(({ id }) => id === insertBefore) : -1;
      const afterIndex = insertAfter ? columns.findIndex(({ id }) => id === insertAfter) : -1;

      if (beforeIndex >= 0) {
        insert(extension, beforeIndex);
      } else if (afterIndex >= 0) {
        const siblingID = lastAfter.get(insertAfter);
        const siblingIndex = siblingID ? columns.findIndex(({ id }) => id === siblingID) : -1;
        insert(extension, (siblingIndex >= 0 ? siblingIndex : afterIndex) + 1);
        lastAfter.set(insertAfter, extension.properties.columnData.id);
      } else if (!insertBefore && !insertAfter) {
        insert(extension, defaultIndex());
      } else {
        next.push(extension);
        return;
      }
      placed = true;
    });

    if (!placed) {
      // Missing anchors and cycles use the normal position before the actions column.
      next.forEach((extension) => insert(extension, defaultIndex()));
      break;
    }
    pending = next;
  }

  return { columns, extensionsByID };
};

export const useConsoleDataViewColumns = <TData, TCustomRowData>(
  columns: ConsoleDataViewColumn<TData>[],
  columnLayout: ColumnLayout | undefined,
  tableID: string | undefined,
  getDataViewRows: GetDataViewRows<TData, TCustomRowData>,
  getObjectMetadata: ((obj: TData) => ResourceMetadata) | undefined,
  isResizable: boolean,
) => {
  const [resolvedExtensions] = useResolvedExtensions(isConsoleDataViewTableColumn);
  const matchingExtensions = useMemo(
    () =>
      tableID
        ? resolvedExtensions.filter(
            ({ properties }) => getConsoleDataViewID(properties.table) === tableID,
          )
        : [],
    [tableID, resolvedExtensions],
  );
  const translatedExtensions = useTranslatedExtensions(matchingExtensions);

  const ordered = useMemo(() => {
    const result = orderConsoleDataViewColumns(columns, translatedExtensions);
    const hasSelection = result.columns.some(({ type }) => type === 'selection');
    return {
      ...result,
      columns: result.columns.map((column) => {
        const withTitle = { ...column, title: column.title ?? '' };
        const defaults = getDefaultProps(column.type, hasSelection, true);
        return defaults ? { ...withTitle, props: { ...defaults, ...column.props } } : withTitle;
      }),
    };
  }, [columns, translatedExtensions]);
  const { columns: resizableColumns, resetColumnWidths } = useConsoleDataViewResizableColumns({
    columns: ordered.columns,
    tableID,
    isResizable,
  });

  const managedLayout = useMemo<ColumnLayout | undefined>(() => {
    if (!columnLayout) return undefined;
    const fixedColumnIDs = new Set(
      ordered.columns
        .filter(({ type }) => type === 'actions' || type === 'selection')
        .map(({ id }) => id),
    );
    const configurableColumns = columnLayout.columns.filter(({ id }) => !fixedColumnIDs.has(id));
    if (!ordered.extensionsByID.size) {
      return configurableColumns.length === columnLayout.columns.length
        ? columnLayout
        : { ...columnLayout, columns: configurableColumns };
    }
    const original = new Map(configurableColumns.map((column) => [column.id, column]));
    return {
      ...columnLayout,
      columns: ordered.columns
        .filter(
          ({ id }) =>
            !fixedColumnIDs.has(id) && (original.has(id) || ordered.extensionsByID.has(id)),
        )
        .map(({ id, title, additional }) => original.get(id) ?? { id, title, additional }),
    };
  }, [columnLayout, ordered]);

  const getRows = useMemo<GetDataViewRows<TData, TCustomRowData>>(
    () => (data, activeColumns) => {
      const hasSelection = activeColumns.some(({ type }) => type === 'selection');
      const getRowName = (obj: TData): string | undefined => {
        const item = obj as { metadata?: { name?: string }; name?: string };
        return item?.metadata?.name ?? getObjectMetadata?.(obj)?.name ?? item?.name;
      };
      const applyCellProps = (rows: DataViewTd[][]): DataViewTd[][] =>
        rows.map((row, rowIndex) =>
          row.map((cell, index) => {
            const type = activeColumns[index]?.type;
            const defaults = getDefaultProps(type, hasSelection);
            if (!defaults) {
              return cell;
            }
            const defaultProps = {
              ...defaults,
              ...(type === 'name' && {
                'data-test': `data-view-cell-${getRowName(data[rowIndex].obj)}-name`,
              }),
            };
            return cell && typeof cell === 'object' && 'cell' in cell
              ? { ...cell, props: { ...defaultProps, ...cell.props } }
              : { cell: cell as ReactNode, props: defaultProps };
          }),
        );

      if (!ordered.extensionsByID.size) {
        return applyCellProps(getDataViewRows(data, activeColumns));
      }

      const builtInActiveColumns = activeColumns.filter(
        ({ id }) => !ordered.extensionsByID.has(id),
      );
      const builtInRows = getDataViewRows(data, builtInActiveColumns);
      const extensionCells = new Map<string, DataViewTd[]>();

      activeColumns.forEach(({ id }) => {
        const extension = ordered.extensionsByID.get(id);
        if (extension) {
          try {
            const cells = extension.properties.getCellContent(data);
            if (Array.isArray(cells) && cells.length === data.length) {
              extensionCells.set(id, cells);
            }
          } catch (error) {
            // One plugin's cell renderer must not prevent the other columns from rendering.
            // eslint-disable-next-line no-console
            console.error(
              `Unable to render table column ${id} from ${extension.pluginName}`,
              error,
            );
          }
        }
      });

      return applyCellProps(
        data.map((_, rowIndex) => {
          const builtInCells = new Map(
            builtInActiveColumns.map(({ id }, index) => [id, builtInRows[rowIndex]?.[index]]),
          );
          return activeColumns.map(({ id }) =>
            ordered.extensionsByID.has(id)
              ? (extensionCells.get(id)?.[rowIndex] ?? null)
              : builtInCells.get(id),
          );
        }),
      );
    },
    [getDataViewRows, getObjectMetadata, ordered],
  );

  return {
    columns: resizableColumns,
    columnLayout: managedLayout,
    getDataViewRows: getRows,
    resetColumnWidths,
  };
};
