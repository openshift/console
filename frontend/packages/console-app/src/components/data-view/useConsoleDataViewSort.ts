import type { BaseSyntheticEvent } from 'react';
import { useCallback, useEffect } from 'react';
import type { ISortBy } from '@patternfly/react-table';
import { SortByDirection } from '@patternfly/react-table';
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
  const hasSelectionColumn = columns.some(({ type }) => type === 'selection');
  const fallbackSortColumnIndex = hasSelectionColumn
    ? columns.findIndex(({ type, sort }) => type !== 'selection' && Boolean(sort))
    : 0;
  const sortColumnIndexFromURL = sortByParam
    ? columns.findIndex(
        ({ title, type, sort }) =>
          title === sortByParam && (!hasSelectionColumn || (type !== 'selection' && Boolean(sort))),
      )
    : -1;
  const sortBy: ISortBy =
    sortColumnIndexFromURL >= 0
      ? {
          index: sortColumnIndexFromURL,
          direction: getSortByDirection(orderByParam),
        }
      : {
          index: sortColumnIndex ?? fallbackSortColumnIndex,
          direction: sortDirection ?? SortByDirection.asc,
        };

  // Remove sort parameters for columns that are no longer visible or available.
  useEffect(() => {
    if (columnsResolved && sortByParam !== null && sortColumnIndexFromURL < 0) {
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
  }, [columnsResolved, sortByParam, sortColumnIndexFromURL, setSearchParams]);

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
