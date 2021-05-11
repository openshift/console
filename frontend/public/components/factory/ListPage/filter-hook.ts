import * as React from 'react';

import { getAllTableFilters } from '../table';
import { RowFilter } from '../../filter-toolbar';

export type OnFilterChange = (type: string, value: string | string[]) => void;

const filterData = <D>(
  data: D[],
  filter: { [key: string]: string | string[] } = {},
  rowFilters?: RowFilter[],
) =>
  data?.filter((d) =>
    Object.keys(filter).every((type) =>
      rowFilters[type] && filter?.[type]?.length > 0 ? rowFilters[type](filter[type], d) : true,
    ),
  );

export const useListPageFilter = <D>(
  data: D[],
  rowFilters?: RowFilter[],
  staticFilters?: { [key: string]: string | string[] },
): [D[], D[], OnFilterChange] => {
  const [filter, setFilter] = React.useState<{ [key: string]: string | string[] }>();

  const onFilterChange = React.useCallback(
    (type, value) => setFilter((state) => ({ ...state, [type]: value })),
    [],
  );

  return React.useMemo(() => {
    const tableFilters = getAllTableFilters(rowFilters);

    const staticData = filterData(data, staticFilters, tableFilters);
    const filteredData = filterData(staticData, filter, tableFilters);

    return [staticData, filteredData, onFilterChange];
  }, [data, filter, onFilterChange, rowFilters, staticFilters]);
};
