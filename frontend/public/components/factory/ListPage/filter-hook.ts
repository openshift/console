import * as React from 'react';
import * as _ from 'lodash';
import { useLocation } from 'react-router-dom';

import { getAllTableFilters, FilterValue, FilterMap } from '../table-filters';
import { RowFilter } from '../../filter-toolbar';

export type OnFilterChange = (type: string, value: FilterValue) => void;

const filterData = <D>(
  data: D[],
  filter: { [key: string]: FilterValue } = {},
  rowFilters?: FilterMap,
) => {
  const filterTypes = Object.keys(filter);
  return data?.filter((d) =>
    filterTypes.every((type) =>
      rowFilters[type] && !_.isEmpty(filter?.[type]) ? rowFilters[type](filter[type], d) : true,
    ),
  );
};

export const useListPageFilter = <D>(
  data: D[],
  rowFilters?: RowFilter[],
  staticFilters?: { [key: string]: FilterValue },
): [D[], D[], OnFilterChange] => {
  const [filter, setFilter] = React.useState<{ [key: string]: FilterValue }>();

  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const name = params.get('name');
    if (name && name !== filter?.name?.selected?.[0]) {
      setFilter((state) => ({ ...state, name: { selected: [name] } }));
    }
  }, [filter, location]);

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
