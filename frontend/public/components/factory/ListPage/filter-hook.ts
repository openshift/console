import * as React from 'react';
import * as _ from 'lodash';
import { useLocation } from 'react-router-dom';
import { UseListPageFilter, FilterValue } from '@console/dynamic-plugin-sdk';

import { getAllTableFilters, FilterMap } from '../table-filters';

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

export const useListPageFilter: UseListPageFilter = (data, rowFilters, staticFilters) => {
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
