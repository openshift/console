import * as React from 'react';
import { useDataViewPagination, DataViewTh } from '@patternfly/react-data-view';
import { SortByDirection, ThProps } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useSearchParams } from 'react-router-dom-v5-compat';
import {
  K8sResourceCommon,
  TableColumn,
  RowProps,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useActiveColumns } from '@console/internal/components/factory/Table/active-columns-hook';
import { sortResourceByValue } from '@console/internal/components/factory/Table/sort';
import { ResourceDataViewColumn, GetDataViewRows } from './types';
import { useResourceDataViewSort } from './useResourceDataViewSort';

const isDataViewConfigurableColumn = (
  column: DataViewTh,
): column is Extract<DataViewTh, { cell: React.ReactNode }> => {
  return (column as any)?.cell !== undefined;
};

export const useResourceDataViewData = <
  TData extends K8sResourceCommon = K8sResourceCommon,
  TCustomRowData = any
>({
  columns,
  filteredData,
  getDataViewRows,
  showNamespaceOverride,
  columnManagementID,
  customRowData,
}: {
  columns: TableColumn<TData>[];
  filteredData: TData[];
  getDataViewRows: GetDataViewRows<TData, TCustomRowData>;
  showNamespaceOverride?: boolean;
  columnManagementID?: string;
  customRowData?: TCustomRowData;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const pagination = useDataViewPagination({
    perPage: 50,
    searchParams,
    setSearchParams,
  });

  const [activeColumns] = useActiveColumns({
    columns,
    showNamespaceOverride,
    columnManagementID,
  });

  const dataViewColumns = React.useMemo<ResourceDataViewColumn<TData>[]>(
    () =>
      activeColumns.map(({ id, title, sort, props }, index) => ({
        id,
        title,
        sortFunction: sort,
        props: {
          className: props.classes,
          sort: {
            columnIndex: index,
            sortBy: {
              defaultDirection: SortByDirection.asc,
              direction: SortByDirection.asc,
              index: 0,
            },
          },
          isStickyColumn: props.isStickyColumn,
        } as ThProps,
        cell: <span>{title}</span>,
      })),
    [activeColumns],
  );

  const { sortBy, onSort } = useResourceDataViewSort<TData>({
    columns: dataViewColumns,
  });

  const sortedData = React.useMemo(() => {
    const sortColumn = dataViewColumns[sortBy.index];

    if (!isDataViewConfigurableColumn(sortColumn)) {
      return filteredData;
    }

    if (typeof sortColumn.props.sort === 'string') {
      return filteredData.sort(
        sortResourceByValue(sortBy.direction, (obj) =>
          _.get(obj, (sortColumn.props.sort as unknown) as string, ''),
        ),
      );
    }

    if (typeof sortColumn.sortFunction === 'string') {
      return filteredData.sort(
        sortResourceByValue(sortBy.direction, (obj) =>
          _.get(obj, sortColumn.sortFunction as string),
        ),
      );
    }

    if (typeof sortColumn.sortFunction === 'function') {
      return sortColumn.sortFunction(filteredData, sortBy.direction);
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

  const dataViewRows = getDataViewRows(transformedData, dataViewColumns);

  // We have to tack sort information to the columns once all data is available
  dataViewColumns.forEach((column) => {
    if (isDataViewConfigurableColumn(column)) {
      column.props.sort.sortBy.index = sortBy.index;
      column.props.sort.sortBy.direction = sortBy.direction;
      column.props.sort.onSort = onSort;
    }
  });

  return { dataViewRows, dataViewColumns, pagination };
};
