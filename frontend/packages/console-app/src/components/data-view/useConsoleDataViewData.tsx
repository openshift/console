import type { FormEvent, ReactNode } from 'react';
import { useRef, useEffect, useMemo } from 'react';
import { useDataViewPagination } from '@patternfly/react-data-view';
import type { DataViewTh } from '@patternfly/react-data-view/dist/esm/DataViewTable/DataViewTable';
import type { ThProps } from '@patternfly/react-table';
import { SortByDirection } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import type {
  RowProps,
  ConsoleDataViewColumn,
  GetDataViewRows,
  ResourceFilters,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useActiveColumns } from '@console/internal/components/factory/Table/active-columns-hook';
import { sortResourceByValue } from '@console/internal/components/factory/Table/sort';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useConsoleDataViewSort, getSortByDirection } from './useConsoleDataViewSort';

interface EnhancedDataViewTh extends Extract<DataViewTh, { cell: ReactNode }> {
  id: string;
}

const isDataViewConfigurableColumn = <TData,>(
  column: ConsoleDataViewColumn<TData>,
): column is ConsoleDataViewColumn<TData> & { cell: ReactNode } => column?.cell !== undefined;

export const useConsoleDataViewData = <
  TData,
  TCustomRowData = any,
  TFilters extends ResourceFilters = ResourceFilters,
>({
  columns,
  filteredData,
  filters,
  getDataViewRows,
  defaultSortColumnId,
  defaultSortDirection,
  showNamespaceOverride,
  columnManagementID,
  columnsResolved = true,
  customRowData,
  isResizable = true,
  selection,
}: {
  columns: ConsoleDataViewColumn<TData>[];
  filteredData: TData[];
  filters: TFilters;
  getDataViewRows: GetDataViewRows<TData, TCustomRowData>;
  defaultSortColumnId?: string;
  defaultSortDirection?: SortByDirection;
  showNamespaceOverride?: boolean;
  columnManagementID?: string;
  columnsResolved?: boolean;
  customRowData?: TCustomRowData;
  isResizable?: boolean;
  selection?: {
    selectedItems: Set<string>;
    onSelectAll: (isSelecting: boolean, filteredItems: TData[]) => void;
    getItemId: (item: TData) => string;
    isSelectable?: (item: TData) => boolean;
  };
}) => {
  const { t } = useTranslation('console-app');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectionEnabled = Boolean(selection);
  const selectedItems = selection?.selectedItems;
  const onSelectAll = selection?.onSelectAll;
  const getItemId = selection?.getItemId;
  const isSelectable = selection?.isSelectable;
  const prevFiltersRef = useRef(filters);
  const [activeNamespace] = useActiveNamespace();
  const prevNamespaceRef = useRef(activeNamespace);

  const pagination = useDataViewPagination({
    perPage: 50,
    searchParams,
    setSearchParams,
  });

  // Reset pagination to page 1 when filters or namespace change
  useEffect(() => {
    const currentFilters = filters;
    const prevFilters = prevFiltersRef.current;
    const filtersChanged = !_.isEqual(currentFilters, prevFilters);

    const currentNamespace = activeNamespace;
    const prevNamespace = prevNamespaceRef.current;
    const namespaceChanged = currentNamespace !== prevNamespace;

    if ((filtersChanged || namespaceChanged) && pagination.page > 1) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('page', '1');
        return newParams;
      });
    }

    prevFiltersRef.current = currentFilters;
    prevNamespaceRef.current = currentNamespace;
  }, [filters, activeNamespace, pagination.page, setSearchParams]);

  const [activeColumns, activeColumnsResolved] = useActiveColumns({
    columns,
    showNamespaceOverride,
    columnManagementID,
  });

  const dataViewColumns = useMemo<ConsoleDataViewColumn<TData>[]>(() => {
    // Calculate selection state across all filtered items
    const totalCount = isSelectable
      ? filteredData.filter(isSelectable).length
      : filteredData.length;

    return activeColumns.map(({ id, type, title, tooltip, sort, props, resizableProps }, index) => {
      // Filter out custom Console props that aren't valid PatternFly ThProps
      const headerProps: ThProps = {
        ...props,
        dataLabel: title,
      };

      if (tooltip) {
        headerProps.info = {
          ...headerProps.info,
          tooltip,
          ariaLabel:
            headerProps.info?.ariaLabel ??
            t('More information about {{column}}', { column: title }),
        };
      }

      if (sort) {
        headerProps.sort = {
          columnIndex: index,
          sortBy: {
            index: 0,
            direction: SortByDirection.asc,
            defaultDirection: SortByDirection.asc,
          },
        };
      }

      // Add select-all checkbox to selection column header
      // Note: onSelect handler is updated later with visibleItems via dataViewColumnsWithSortApplied
      // The checkbox state is determined by visible items only, not all items
      if (id === 'select' && onSelectAll) {
        headerProps['data-test'] = 'select-all-header';
        headerProps.select = {
          onSelect: (_event: FormEvent<HTMLInputElement>, isSelecting: boolean) => {
            // This will be replaced with the actual handler in dataViewColumnsWithSortApplied
            onSelectAll(isSelecting, filteredData);
          },
          isSelected: false, // Will be updated based on visible items
          isDisabled: totalCount === 0,
        };
      }

      return {
        id,
        type,
        title,
        sort,
        props: headerProps,
        resizableProps: isResizable ? resizableProps : undefined,
        cell: title ? (
          <span>{title}</span>
        ) : (
          <span className="pf-v6-u-screen-reader">{t('Actions')}</span>
        ),
      } satisfies ConsoleDataViewColumn<TData>;
    });
  }, [activeColumns, t, isResizable, isSelectable, onSelectAll, filteredData]);

  // Resolved from the column id rather than taken as an index, so that hiding or reordering
  // columns cannot silently point the default sort at a different column.
  const defaultSortColumnIndex = useMemo(() => {
    const index = dataViewColumns.findIndex(({ id }) => id === defaultSortColumnId);
    return index === -1 ? undefined : index;
  }, [dataViewColumns, defaultSortColumnId]);

  const { sortBy, onSort } = useConsoleDataViewSort<TData>({
    columns: dataViewColumns,
    sortColumnIndex: defaultSortColumnIndex,
    sortDirection: defaultSortDirection,
    columnsResolved: columnsResolved && activeColumnsResolved,
  });

  const sortedData = useMemo(() => {
    const sortColumn = dataViewColumns[sortBy.index];
    const sortDirection = getSortByDirection(sortBy.direction);

    if (!isDataViewConfigurableColumn(sortColumn)) {
      return filteredData;
    }

    if (typeof sortColumn.sort === 'string') {
      return filteredData.sort(
        sortResourceByValue(sortDirection, (obj) => _.get(obj, sortColumn.sort as string)),
      );
    }

    if (typeof sortColumn.sort === 'function') {
      return sortColumn.sort(filteredData, sortDirection);
    }

    return filteredData;
  }, [dataViewColumns, filteredData, sortBy.direction, sortBy.index]);

  const transformedData = sortedData
    .map<RowProps<TData, TCustomRowData>>((obj, index) => ({
      obj,
      rowData: customRowData,
      activeColumnIDs: new Set<string>(),
      index,
    }))
    .slice(
      (pagination.page - 1) * pagination.perPage,
      (pagination.page - 1) * pagination.perPage + pagination.perPage,
    );

  const visibleItems = transformedData.map((item) => item.obj);
  const dataViewRows = getDataViewRows(transformedData, dataViewColumns);

  // Apply sort state and select-all handler updates to columns independently
  const dataViewColumnsWithSortApplied = useMemo<EnhancedDataViewTh[]>(
    () =>
      dataViewColumns.map((column) => {
        if (!isDataViewConfigurableColumn(column)) {
          return {
            ...column,
            cell: null,
          };
        }

        let updatedProps = column.props;

        if (column.sort !== undefined && column.props.sort) {
          updatedProps = {
            ...updatedProps,
            sort: {
              ...updatedProps.sort,
              sortBy: {
                ...updatedProps.sort.sortBy,
                index: sortBy.index,
                direction: sortBy.direction,
              },
              onSort,
            },
          };
        }

        if (
          column.id === 'select' &&
          column.props.select &&
          selectionEnabled &&
          selectedItems &&
          getItemId &&
          onSelectAll
        ) {
          const selectableVisibleItems = isSelectable
            ? visibleItems.filter(isSelectable)
            : visibleItems;
          const visibleSelectedCount = selectableVisibleItems.filter((item) =>
            selectedItems.has(getItemId(item)),
          ).length;
          const allVisibleSelected =
            selectableVisibleItems.length > 0 &&
            visibleSelectedCount === selectableVisibleItems.length;
          const isIndeterminate =
            visibleSelectedCount > 0 && visibleSelectedCount < selectableVisibleItems.length;

          updatedProps = {
            ...updatedProps,
            select: {
              ...updatedProps.select,
              onSelect: (_event: FormEvent<HTMLInputElement>, isSelecting: boolean) => {
                onSelectAll(isSelecting, visibleItems);
              },
              isSelected: Boolean(allVisibleSelected),
              isIndeterminate,
              isDisabled: selectableVisibleItems.length === 0,
            },
          };
        }

        return updatedProps !== column.props ? { ...column, props: updatedProps } : column;
      }),
    [
      dataViewColumns,
      sortBy.index,
      sortBy.direction,
      onSort,
      selectionEnabled,
      selectedItems,
      getItemId,
      isSelectable,
      onSelectAll,
      visibleItems,
    ],
  );

  return {
    dataViewRows,
    dataViewColumns: dataViewColumnsWithSortApplied,
    pagination,
    visibleItems,
  };
};
