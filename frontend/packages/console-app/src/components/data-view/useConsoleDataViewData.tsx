import type { FormEvent, ReactNode } from 'react';
import { useRef, useEffect, useMemo } from 'react';
import { useDataViewPagination } from '@patternfly/react-data-view';
import type { DataViewTh } from '@patternfly/react-data-view/dist/esm/DataViewTable/DataViewTable';
import type { ThProps } from '@patternfly/react-table';
import { SortByDirection } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import type { ConsoleDataViewTh } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import type {
  TableColumn,
  RowProps,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useActiveColumns } from '@console/internal/components/factory/Table/active-columns-hook';
import { sortResourceByValue } from '@console/internal/components/factory/Table/sort';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import type { ConsoleDataViewColumn, GetDataViewRows, ResourceFilters } from './types';
import { useConsoleDataViewSort, getSortByDirection } from './useConsoleDataViewSort';

const isDataViewConfigurableColumn = (
  column: ConsoleDataViewTh,
): column is Extract<DataViewTh, { cell: ReactNode }> => {
  return (column as any)?.cell !== undefined;
};

export const useConsoleDataViewData = <
  TData,
  TCustomRowData = any,
  TFilters extends ResourceFilters = ResourceFilters
>({
  columns,
  filteredData,
  filters,
  getDataViewRows,
  showNamespaceOverride,
  columnManagementID,
  customRowData,
  isResizable = true,
  selection,
}: {
  columns: TableColumn<TData>[];
  filteredData: TData[];
  filters: TFilters;
  getDataViewRows: GetDataViewRows<TData, TCustomRowData>;
  showNamespaceOverride?: boolean;
  columnManagementID?: string;
  customRowData?: TCustomRowData;
  isResizable?: boolean;
  selection?: {
    selectedItems: Set<string>;
    onSelectAll?: (isSelecting: boolean, filteredItems: TData[]) => void;
    getItemId: (item: TData) => string;
  };
}) => {
  const { t } = useTranslation('console-app');
  const [searchParams, setSearchParams] = useSearchParams();
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

  const [activeColumns] = useActiveColumns({
    columns,
    showNamespaceOverride,
    columnManagementID,
  });

  const dataViewColumns = useMemo<ConsoleDataViewColumn<TData>[]>(() => {
    // Calculate selection state across all filtered items
    const totalCount = filteredData.length;

    return activeColumns.map(({ id, title, sort, props, resizableProps }, index) => {
      // Filter out custom Console props that aren't valid PatternFly ThProps
      const { isActionCell, ...validThProps } = props || {};

      const headerProps: ThProps = {
        ...validThProps,
        dataLabel: title,
      };

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
      if (id === 'select' && selection?.onSelectAll) {
        headerProps['data-test'] = 'select-all-header';
        headerProps.select = {
          onSelect: (_event: FormEvent<HTMLInputElement>, isSelecting: boolean) => {
            // This will be replaced with the actual handler in dataViewColumnsWithSortApplied
            selection.onSelectAll(isSelecting, filteredData);
          },
          isSelected: false, // Will be updated based on visible items
          isDisabled: totalCount === 0,
        };
      }

      return {
        id,
        title,
        sortFunction: sort,
        props: headerProps,
        resizableProps: isResizable ? resizableProps : undefined,
        cell: title ? (
          <span>{title}</span>
        ) : (
          <span className="pf-v6-u-screen-reader">{t('Actions')}</span>
        ),
      };
    });
  }, [activeColumns, t, isResizable, selection, filteredData]);

  const { sortBy, onSort } = useConsoleDataViewSort<TData>({
    columns: dataViewColumns,
  });

  const sortedData = useMemo(() => {
    const sortColumn = dataViewColumns[sortBy.index];
    const sortDirection = getSortByDirection(sortBy.direction);

    if (!isDataViewConfigurableColumn(sortColumn)) {
      return filteredData;
    }

    if (typeof sortColumn.sortFunction === 'string') {
      return filteredData.sort(
        sortResourceByValue(sortDirection, (obj) => _.get(obj, sortColumn.sortFunction as string)),
      );
    }

    if (typeof sortColumn.sortFunction === 'function') {
      return sortColumn.sortFunction(filteredData, sortDirection);
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
  const dataViewColumnsWithSortApplied = useMemo(
    () =>
      dataViewColumns.map((column) => {
        if (!isDataViewConfigurableColumn(column)) {
          return column;
        }

        let updatedProps = column.props;

        if (column.sortFunction !== undefined && column.props.sort) {
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

        if (column.id === 'select' && column.props.select && selection?.onSelectAll) {
          const visibleSelectedCount = visibleItems.filter((item) =>
            selection.selectedItems.has(selection.getItemId(item)),
          ).length;
          const allVisibleSelected =
            visibleItems.length > 0 && visibleSelectedCount === visibleItems.length;
          const isIndeterminate =
            visibleSelectedCount > 0 && visibleSelectedCount < visibleItems.length;

          updatedProps = {
            ...updatedProps,
            select: {
              ...updatedProps.select,
              onSelect: (_event: FormEvent<HTMLInputElement>, isSelecting: boolean) => {
                selection.onSelectAll(isSelecting, visibleItems);
              },
              isSelected: Boolean(allVisibleSelected),
              isIndeterminate,
            },
          };
        }

        return updatedProps !== column.props ? { ...column, props: updatedProps } : column;
      }),
    [dataViewColumns, sortBy.index, sortBy.direction, onSort, selection, visibleItems],
  );

  return {
    dataViewRows,
    dataViewColumns: dataViewColumnsWithSortApplied,
    pagination,
    visibleItems,
  };
};
