import type { BaseSyntheticEvent } from 'react';
import { useCallback, useEffect } from 'react';
import type { ISortBy } from '@patternfly/react-table';
import { SortByDirection } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useSearchParams } from 'react-router';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

export const getSortByDirection = (value: string): SortByDirection =>
  value === SortByDirection.desc.valueOf() ? SortByDirection.desc : SortByDirection.asc;

export const useConsoleDataViewSort = <TData>({
  columns,
  sortColumnIndex,
  sortDirection,
  columnsResolved = true,
}: {
  columns: ConsoleDataViewColumn<TData>[];
  sortColumnIndex?: number;
  sortDirection?: SortByDirection;
  columnsResolved?: boolean;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const sortByParam = searchParams.get('sortBy');
  const orderByParam = searchParams.get('orderBy');
  const sortColumnIndexFromURL = sortByParam ? _.findIndex(columns, { title: sortByParam }) : -1;
  const sortBy: ISortBy =
    sortColumnIndexFromURL >= 0
      ? {
          index: sortColumnIndexFromURL,
          direction: getSortByDirection(orderByParam),
        }
      : {
          index: sortColumnIndex ?? 0,
          direction: sortDirection ?? SortByDirection.asc,
        };

  // Remove sort parameters for columns that are no longer visible or available.
  useEffect(() => {
    if (
      columnsResolved &&
      sortByParam !== null &&
      !columns.some(
        ({ title }) => typeof title === 'string' && title.length > 0 && title === sortByParam,
      )
    ) {
      // Defer the rewrite so it preserves query updates from pagination on the same commit.
      const timeout = setTimeout(() => {
        setSearchParams(
          () => {
            // The setter's parameters are a render snapshot, so read the current URL.
            const newParams = new URLSearchParams(window.location.search);
            if (newParams.get('sortBy') === sortByParam) {
              newParams.delete('sortBy');
              newParams.delete('orderBy');
            }
            return newParams;
          },
          { replace: true },
        );
      });
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [columns, columnsResolved, sortByParam, setSearchParams]);

  const applySort = useCallback(
    (index: number, direction: SortByDirection) => {
      const sortColumn = columns[index];

      if (sortColumn) {
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set('sortBy', sortColumn.title);
          newParams.set('orderBy', direction);
          return newParams;
        });
      }
    },
    [columns, setSearchParams],
  );

  const onSort = useCallback(
    (event: BaseSyntheticEvent, index: number, direction: SortByDirection) => {
      event.preventDefault();
      applySort(index, direction);
    },
    [applySort],
  );

  return { sortBy, onSort };
};
