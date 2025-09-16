import * as React from 'react';
import { useDataViewPagination, DataViewTh } from '@patternfly/react-data-view';
import { SortByDirection, ThProps } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom-v5-compat';
import {
  K8sResourceCommon,
  TableColumn,
  RowProps,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useActiveColumns } from '@console/internal/components/factory/Table/active-columns-hook';
import { sortResourceByValue } from '@console/internal/components/factory/Table/sort';
import { ResourceDataViewColumn, GetDataViewRows } from './types';
import { useResourceDataViewSort, getSortByDirection } from './useResourceDataViewSort';

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
  const { t } = useTranslation();
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
      activeColumns.map(
        (
          { id, title, sort, props: { classes, isStickyColumn, stickyMinWidth, modifier } },
          index,
        ) => {
          const headerProps: ThProps = {
            className: classes,
            isStickyColumn,
            stickyMinWidth,
            modifier,
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

          return {
            id,
            title,
            sortFunction: sort,
            props: headerProps,
            cell: title ? (
              <span>{title}</span>
            ) : (
              <span className="pf-v6-u-screen-reader">{t('public~Actions')}</span>
            ),
          };
        },
      ),
    [activeColumns, t],
  );

  const { sortBy, onSort } = useResourceDataViewSort<TData>({
    columns: dataViewColumns,
  });

  const sortedData = React.useMemo(() => {
    const sortColumn = dataViewColumns[sortBy.index];
    const sortDirection = getSortByDirection(sortBy.direction);

    if (!isDataViewConfigurableColumn(sortColumn)) {
      return filteredData;
    }

    if (typeof sortColumn.props.sort === 'string') {
      return filteredData.sort(
        sortResourceByValue(sortDirection, (obj) =>
          _.get(obj, (sortColumn.props.sort as unknown) as string, ''),
        ),
      );
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

  const dataViewRows = getDataViewRows(transformedData, dataViewColumns);

  // This code fixes a sorting issue but should be revisited to add more clarity
  const dataViewColumnsWithSortApplied = React.useMemo(
    () =>
      dataViewColumns.map((column) => {
        const shouldApplySort =
          isDataViewConfigurableColumn(column) &&
          column.sortFunction !== undefined &&
          column.props.sort;

        return shouldApplySort
          ? {
              ...column,
              props: {
                ...column.props,
                sort: {
                  ...column.props.sort,
                  sortBy: {
                    ...column.props.sort.sortBy,
                    index: sortBy.index,
                    direction: sortBy.direction,
                  },
                  onSort,
                },
              },
            }
          : column;
      }),
    [dataViewColumns, sortBy.index, sortBy.direction, onSort],
  );

  return { dataViewRows, dataViewColumns: dataViewColumnsWithSortApplied, pagination };
};
