import * as React from 'react';
import { SortByDirection, ISortBy } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useSearchParams } from 'react-router-dom-v5-compat';
import { ConsoleDataViewColumn } from './types';

export const getSortByDirection = (value: string): SortByDirection =>
  value === SortByDirection.desc.valueOf() ? SortByDirection.desc : SortByDirection.asc;

export const useConsoleDataViewSort = <TData>({
  columns,
  sortColumnIndex,
  sortDirection,
}: {
  columns: ConsoleDataViewColumn<TData>[];
  sortColumnIndex?: number;
  sortDirection?: SortByDirection;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize sort state from URL params or defaults
  const getInitialSortState = React.useCallback<() => ISortBy>(() => {
    const sortByParam = searchParams.get('sortBy');
    const orderByParam = searchParams.get('orderBy');

    if (sortByParam && columns.length > 0) {
      const columnIndex = _.findIndex(columns, { title: sortByParam });

      if (columnIndex >= 0) {
        return {
          index: columnIndex,
          direction: getSortByDirection(orderByParam),
        };
      }
    }

    return {
      index: sortColumnIndex ?? 0,
      direction: sortDirection ?? SortByDirection.asc,
    };
  }, [searchParams, columns, sortColumnIndex, sortDirection]);

  const [sortBy, setSortBy] = React.useState<ISortBy>(getInitialSortState);

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

    setSortBy((prevSortState) => {
      // Only update if the state actually changed
      return _.isEqual(prevSortState, newSortState) ? prevSortState : newSortState;
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
