import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { LoadedAndResolvedExtension } from '@openshift/dynamic-plugin-sdk';
import type { DataViewTd } from '@patternfly/react-data-view/dist/esm/DataViewTable/DataViewTable';
import { useTranslation } from 'react-i18next';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type {
  ColumnLayout,
  ConsoleDataViewColumn,
  ConsoleDataViewRow,
  GetDataViewRows,
  ResourceMetadata,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { isConsoleDataViewTableColumn } from '@console/dynamic-plugin-sdk/src/extensions/dataview';
import type { ConsoleDataViewTableColumn } from '@console/dynamic-plugin-sdk/src/extensions/dataview';
import { useTranslatedExtensions } from '@console/plugin-sdk/src/utils/useTranslatedExtensions';
import { getConsoleDataViewID } from './getConsoleDataViewID';
import { useConsoleDataViewResizableColumns } from './useConsoleDataViewResizableColumns';

export type ConsoleDataViewColumnLayout = Omit<ColumnLayout, 'columns'> & {
  columns: (ColumnLayout['columns'][number] & Pick<ConsoleDataViewColumn, 'type'>)[];
};

type ResolvedTableColumn = LoadedAndResolvedExtension<ConsoleDataViewTableColumn>;

const isDataViewCellObject = (cell: DataViewTd): cell is Extract<DataViewTd, { cell: ReactNode }> =>
  cell !== null && typeof cell === 'object' && 'cell' in cell;

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

const nowrapCellProps = {
  modifier: 'nowrap' as const,
};

const nameCellProps = {
  ...cellIsStickyProps,
  ...nowrapCellProps,
  hasRightBorder: true,
};

const actionsCellProps = {
  ...cellIsStickyProps,
  hasLeftBorder: true,
  isActionCell: true,
};

const getDefaultProps = (
  type: ConsoleDataViewColumn['type'],
  hasSelection: boolean,
  isHeader = false,
) => {
  switch (type) {
    case 'name':
      return hasSelection
        ? { ...nameCellProps, stickyLeftOffset: selectionColumnWidth }
        : nameCellProps;
    case 'namespace':
      return nowrapCellProps;
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
): columnData is ConsoleDataViewColumn & { title: string } => {
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
      defaultVisible: columnData.defaultVisible ?? false,
    } as ConsoleDataViewColumn<TData>);
    extensionsByID.set(columnData.id, extension);
  };
  const defaultIndex = (): number => {
    const actionIndex = columns.findIndex(({ type }) => type === 'actions');
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
  columnLayout: ConsoleDataViewColumnLayout,
  tableID: string | undefined,
  getDataViewRows: GetDataViewRows<TData, TCustomRowData>,
  getObjectMetadata: ((obj: TData) => ResourceMetadata) | undefined,
  isResizable: boolean,
) => {
  const { t } = useTranslation('console-app');
  const [resolvedExtensions, extensionsResolved] = useResolvedExtensions(
    isConsoleDataViewTableColumn,
  );
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
        const preset =
          column.type === 'name'
            ? { title: t('Name'), sort: 'metadata.name' }
            : column.type === 'namespace'
              ? { title: t('Namespace'), sort: 'metadata.namespace' }
              : undefined;
        const resolvedColumn = {
          ...column,
          title: column.title ?? preset?.title ?? '',
          sort: column.sort ?? preset?.sort,
        };
        const defaults = getDefaultProps(column.type, hasSelection, true);
        return defaults
          ? { ...resolvedColumn, props: { ...defaults, ...column.props } }
          : resolvedColumn;
      }),
    };
  }, [columns, t, translatedExtensions]);
  const { columns: resizableColumns, resetColumnWidths } = useConsoleDataViewResizableColumns({
    columns: ordered.columns,
    tableID,
    isResizable,
  });

  const managedLayout = useMemo<ConsoleDataViewColumnLayout>(() => {
    const fixedColumnIDs = new Set(
      ordered.columns
        .filter(({ type }) => type === 'actions' || type === 'selection')
        .map(({ id }) => id),
    );
    const configurableColumns = columnLayout.columns.filter(({ id }) => !fixedColumnIDs.has(id));
    const original = new Map(configurableColumns.map((column) => [column.id, column]));
    return {
      ...columnLayout,
      columns: ordered.columns
        .filter(
          ({ id }) =>
            !fixedColumnIDs.has(id) && (original.has(id) || ordered.extensionsByID.has(id)),
        )
        .map(({ id, type, title, defaultVisible }) => ({
          ...(original.get(id) ?? { id, type, additional: defaultVisible === false }),
          title,
        })),
    };
  }, [columnLayout, ordered]);

  const getRows = useMemo<GetDataViewRows<TData, TCustomRowData>>(
    () => (data, activeColumns) => {
      const hasSelection = activeColumns.some(({ type }) => type === 'selection');
      const getRowName = (obj: TData): string | undefined => {
        const item = obj as { metadata?: { name?: string }; name?: string };
        return item?.metadata?.name ?? getObjectMetadata?.(obj)?.name ?? item?.name;
      };
      const applyCellProps = (rows: ConsoleDataViewRow[]): ConsoleDataViewRow[] =>
        rows.map((row, rowIndex) =>
          row.map((cell, index) => {
            const type = activeColumns[index]?.type;
            const defaults = getDefaultProps(type, hasSelection);
            if (!defaults) return cell;
            return {
              ...cell,
              props: {
                ...defaults,
                ...(type === 'name' && {
                  'data-test': `data-view-cell-${getRowName(data[rowIndex].obj)}-name`,
                }),
                ...cell.props,
              },
            };
          }),
        );

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
            (builtInRows[rowIndex] ?? []).map((cell) => [cell.id, cell]),
          );
          return activeColumns.map(({ id }) => {
            if (!ordered.extensionsByID.has(id)) {
              const cell = builtInCells.get(id);
              return { ...cell, id, cell: cell?.cell ?? null };
            }
            const cell = extensionCells.get(id)?.[rowIndex];
            return isDataViewCellObject(cell) ? { ...cell, id } : { id, cell: cell ?? null };
          });
        }),
      );
    },
    [getDataViewRows, getObjectMetadata, ordered],
  );

  return {
    columns: resizableColumns,
    columnsResolved: extensionsResolved,
    columnLayout: managedLayout,
    getDataViewRows: getRows,
    resetColumnWidths,
  };
};
