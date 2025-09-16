import { useState, useEffect, useCallback, useMemo } from 'react';
import * as _ from 'lodash';
import { useLocation } from 'react-router-dom';
import {
  UseListPageFilter,
  FilterValue,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useExactSearch } from '@console/app/src/components/user-preferences/search/useExactSearch';
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
  const [filter, setFilter] = useState<{ [key: string]: FilterValue }>();
  const [isExactSearch] = useExactSearch();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const name = params.get('name');
    if (!_.isNil(name) && name !== filter?.name?.selected?.[0]) {
      setFilter((state) => ({ ...state, name: { selected: [name] } }));
    }
  }, [filter, location]);

  const onFilterChange = useCallback(
    (type, value) => setFilter((state) => ({ ...state, [type]: value })),
    [],
  );

  return useMemo(() => {
    const tableFilters = getAllTableFilters(rowFilters, isExactSearch);

    const staticData = filterData(data, staticFilters, tableFilters);
    const filteredData = filterData(staticData, filter, tableFilters);

    return [staticData, filteredData, onFilterChange];
  }, [data, filter, isExactSearch, onFilterChange, rowFilters, staticFilters]);
};
