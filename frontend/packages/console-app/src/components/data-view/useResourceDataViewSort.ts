import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useSearchParams } from 'react-router-dom-v5-compat';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ResourceDataViewColumn } from './types';

export const useResourceDataViewSort = <TData extends K8sResourceCommon = K8sResourceCommon>({
  columns,
  sortColumnIndex,
  sortDirection,
}: {
  columns: ResourceDataViewColumn<TData>[];
  sortColumnIndex?: number;
  sortDirection?: SortByDirection;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize sort state from URL params or defaults
  const getInitialSortState = React.useCallback(() => {
    const sortByParam = searchParams.get('sortBy');
    const orderByParam = searchParams.get('orderBy');

    if (sortByParam && columns.length > 0) {
      const columnIndex = _.findIndex(columns, { title: sortByParam });
      if (columnIndex >= 0) {
        const direction =
          orderByParam === SortByDirection.desc.valueOf()
            ? SortByDirection.desc
            : SortByDirection.asc;
        return { index: columnIndex, direction };
      }
    }

    return {
      index: sortColumnIndex ?? 0,
      direction: sortDirection ?? SortByDirection.asc,
    };
  }, [searchParams, columns, sortColumnIndex, sortDirection]);

  const [sortBy, setSortBy] = React.useState<{
    index: number;
    direction: SortByDirection;
  }>(getInitialSortState);

  const applySort = React.useCallback(
    (index: number, direction: SortByDirection) => {
      const sortColumn = columns[index];

      if (sortColumn) {
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set('sortBy', sortColumn.title);
          newParams.set('orderBy', direction);
          return newParams;
        });
        setSortBy({ index, direction });
      }
    },
    [columns, setSearchParams],
  );

  // Update sort state when columns change or URL params change
  React.useEffect(() => {
    const newSortState = getInitialSortState();
    setSortBy((prevState) => {
      // Only update if the state actually changed
      if (
        prevState.index !== newSortState.index ||
        prevState.direction !== newSortState.direction
      ) {
        return newSortState;
      }
      return prevState;
    });
  }, [getInitialSortState]);

  const onSort = React.useCallback(
    (event: React.BaseSyntheticEvent, index: number, direction: SortByDirection) => {
      event.preventDefault();
      applySort(index, direction);
    },
    [applySort],
  );

  return { sortBy, onSort };
};
