import type { BaseSyntheticEvent } from 'react';
import { useCallback, useState, useEffect, useRef } from 'react';
import type { ISortBy } from '@patternfly/react-table';
import { SortByDirection } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useSearchParams } from 'react-router';
import type { ConsoleDataViewColumn } from './types';

export const getSortByDirection = (value: string): SortByDirection =>
  value === SortByDirection.desc.valueOf() ? SortByDirection.desc : SortByDirection.asc;

export const getColumnSortKey = <TData>(column?: ConsoleDataViewColumn<TData>): string | null =>
  column?.id || column?.title || null;

export const findSortColumnIndex = <TData>(
  columns: ConsoleDataViewColumn<TData>[],
  sortKey: string | null,
): number => {
  if (!sortKey || columns.length === 0) {
    return -1;
  }
  return columns.findIndex((column) => column.id === sortKey || column.title === sortKey);
};

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
  const selectedColumnKeyRef = useRef<string | null>(null);

  // Initialize sort state from URL params or defaults
  const getInitialSortState = useCallback<() => ISortBy>(() => {
    const sortByParam = searchParams.get('sortBy');
    const orderByParam = searchParams.get('orderBy');

    const columnIndex = findSortColumnIndex(columns, sortByParam);

    if (columnIndex >= 0) {
      selectedColumnKeyRef.current = getColumnSortKey(columns[columnIndex]);
      return {
        index: columnIndex,
        direction: getSortByDirection(orderByParam),
      };
    }

    return {
      index: sortColumnIndex ?? 0,
      direction: sortDirection ?? SortByDirection.asc,
    };
  }, [searchParams, columns, sortColumnIndex, sortDirection]);

  const [sortBy, setSortBy] = useState<ISortBy>(() => {
    const initialSortState = getInitialSortState();
    if (!selectedColumnKeyRef.current) {
      selectedColumnKeyRef.current = getColumnSortKey(columns[initialSortState.index]);
    }
    return initialSortState;
  });

  const applySort = useCallback(
    (index: number, direction: SortByDirection) => {
      const sortColumn = columns[index];
      const sortKey = getColumnSortKey(sortColumn);

      if (sortColumn && sortKey) {
        selectedColumnKeyRef.current = sortKey;
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set('sortBy', sortKey);
          newParams.set('orderBy', direction);
          return newParams;
        });

        setSortBy({ index, direction });
      }
    },
    [columns, setSearchParams],
  );

  // Update sort state when columns change or URL params change
  useEffect(() => {
    const newSortState = getInitialSortState();
    const sortByParam = searchParams.get('sortBy');

    setSortBy((prevSortState) => {
      if (_.isEqual(prevSortState, newSortState)) {
        return prevSortState;
      }
      // Data refreshes rebuild `columns`. If the URL lost sortBy (or never had it after
      // a same-route navigation), keep the selected column by id instead of snapping to Name.
      if (!sortByParam) {
        const resolvedIndex = findSortColumnIndex(columns, selectedColumnKeyRef.current);
        if (resolvedIndex >= 0) {
          const preservedSortState = {
            index: resolvedIndex,
            direction: prevSortState.direction ?? SortByDirection.asc,
          };
          return _.isEqual(prevSortState, preservedSortState) ? prevSortState : preservedSortState;
        }
        selectedColumnKeyRef.current = getColumnSortKey(columns[newSortState.index]);
      }
      return newSortState;
    });
  }, [getInitialSortState, searchParams, columns]);

  const onSort = useCallback(
    (event: BaseSyntheticEvent, index: number, direction: SortByDirection) => {
      event.preventDefault();
      applySort(index, direction);
    },
    [applySort],
  );

  return { sortBy, onSort };
};
