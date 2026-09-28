import { useCallback, useMemo } from 'react';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { initialFiltersDefault } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ResourceFilters } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import type { RowFilter } from '@console/internal/components/filter-toolbar';

type KnativeFilters = ResourceFilters & Record<string, string | string[]>;

export const useKnativeDataViewFilters = <T,>(rowFilters: RowFilter<T>[] = []) => {
  const initialFilters = useMemo<KnativeFilters>(
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
    (obj: T, filters: KnativeFilters) =>
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
