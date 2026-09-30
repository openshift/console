import { useCallback, useMemo } from 'react';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { initialFiltersDefault } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ResourceFilters } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { RowFilter } from '@console/internal/components/filter-toolbar';

type OlmFilters = ResourceFilters & Record<string, string | string[]>;

/**
 * Adapts the `rowFilters` a ListPage would have rendered in its filter toolbar into the
 * `initialFilters` / `additionalFilterNodes` / `matchesAdditionalFilters` trio that
 * `ConsoleDataView` expects.
 * @param rowFilters - The row filters declared by the page, as passed to ListPage/MultiListPage.
 */
export const useOlmDataViewFilters = <T,>(rowFilters: RowFilter<T>[] = []) => {
  const initialFilters = useMemo<OlmFilters>(
    () =>
      rowFilters.reduce(
        (filters, { type, defaultSelected }) => ({ ...filters, [type]: defaultSelected ?? [] }),
        { ...initialFiltersDefault },
      ),
    [rowFilters],
  );
  const additionalFilterNodes = useMemo(
    () =>
      rowFilters.map(({ type, filterGroupName, items }) => (
        <DataViewCheckboxFilter
          key={type}
          filterId={type}
          title={filterGroupName}
          options={items.map(({ id, title }) => ({ value: id, label: title }))}
        />
      )),
    [rowFilters],
  );
  const matchesAdditionalFilters = useCallback(
    (obj: T, filters: OlmFilters) =>
      rowFilters.every((rowFilter) => {
        const value = filters[rowFilter.type];
        const selected = Array.isArray(value) ? value : [];
        if (!selected.length) {
          return true;
        }
        if (rowFilter.filter) {
          return rowFilter.filter({ selected }, obj);
        }
        return 'reducer' in rowFilter
          ? selected.includes(String(rowFilter.reducer(obj)))
          : selected.some((id) => rowFilter.isMatch(obj, id));
      }),
    [rowFilters],
  );
  return { initialFilters, additionalFilterNodes, matchesAdditionalFilters };
};
